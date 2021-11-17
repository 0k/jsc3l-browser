import AbstractJsc3l from '@com-chain/jsc3l'
import * as t from '@com-chain/jsc3l/src/type'


class LocalStore implements t.IPersistentStore {

  prefix: string

  constructor (prefix: string) {
    this.prefix = prefix
  }

  get (key: string, defaultValue?: string): string {
    const value = localStorage.getItem(`${this.prefix}${key}`)
    if (value === null) return defaultValue
    return value
  }

  set (key: string, value: string): void {
    localStorage.setItem(`${this.prefix}${key}`, value)
  }

  del (key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`)
  }
}


export default class Jsc3l extends AbstractJsc3l {

  persistentStore = new LocalStore('ComChain')

  httpRequest = (opts: t.coreHttpOpts) => {
    if (opts.protocol !== 'https') {
      throw new Error(
        `Protocol ${opts.protocol} unsupported by this implementation`)
    }
    const { method, data, headers } = opts
    const url = `${opts.protocol}://${opts.host}${opts.path}`
    return new Promise(function (resolve, reject) {
      const xhttp = new XMLHttpRequest()
      xhttp.onreadystatechange = function () {
        if (this.readyState !== 4) return

        let data = this.response
        if (typeof data === 'string') {
          let parsedData
          try {
            parsedData = JSON.parse(data)
          } catch (err) {
            parsedData = data
          }
          data = parsedData
        }
        if (this.status === 0) {
          reject(new Error('Invalid request'))
          return
        }
        if (this.status.toString().slice(0, 1) !== '2') {
          reject(new Error(`Request failed with status ${this.status}`))
          return
        }

        resolve(data)
      }
      xhttp.open(method, url, true)
      if (opts?.timeout) xhttp.timeout = opts.timeout
      if (opts?.headers) {
        for (const label in headers) {
          xhttp.setRequestHeader(label, opts.headers[label])
        }
      }
      if (method === 'POST') {
        xhttp.setRequestHeader(
          'Content-Type', 'application/x-www-form-urlencoded')
        xhttp.send(data)
      } else if (method === 'GET') {
        xhttp.send()
      } else {
        throw new Error(`Unknown http method ${method}`)
      }
    })
  }
}

