/* @jsx el */
// Confluence ADAPTER
// All confluence specific stuff goes in here
import Bookmark from '../Bookmark'
import humanizeDuration from 'humanize-duration'
const Parallel = require('async-parallel')

const {h} = require('virtual-dom')

function el (el, props, ...children) {
  return h(el, props, children)
};

const url = require('url')
const reverseStr = (str) => str.split('').reverse().join('')

const TAG_PREFIX = 'floccus:'

export default class ConfluenceAdapter {
  constructor (server) {
    this.server = server
    this.cache = null;
  }

  renderOptions (ctl, rootPath) {
    let data = this.getData()
    const saveTimeout = 1000
    let onchangeURL = (e) => {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = setTimeout(() => ctl.update({...data, url: e.target.value}), saveTimeout)
    }
    let onchangeUsername = (e) => {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = setTimeout(() => ctl.update({...data, username: e.target.value}), saveTimeout)
    }
    let onchangePassword = (e) => {
      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      console.log("onchange password");
      this.saveTimeout = setTimeout(() => ctl.update({...data, password: e.target.value}), saveTimeout)
    }
    let onchangeServerRoot = (e) => {

      if (this.saveTimeout) clearTimeout(this.saveTimeout)
      this.saveTimeout = setTimeout(() => {
        console.log("setting timeout?");
        // let val = e.target.value
        // if (val[val.length - 1] === '/') {
        //   val = val.substr(0,  val.length - 1)
        //   e.target.value = val
        // }
        ctl.update({...data, serverRoot: e.target.value})
      }, saveTimeout)
    }
    return <div className="account">
      <form>
        <table>
          <tr>
            <td><label for="url">Confluence server URL:</label></td>
            <td><input value={new InputInitializeHook(data.url)} type="text" className="url" name="url" ev-keyup={onchangeURL} ev-blur={onchangeURL}/></td>
          </tr>
          <tr>
            <td><label for="username">User name:</label></td>
            <td><input value={new InputInitializeHook(data.username)} type="text" className="username" name="username" ev-keyup={onchangeUsername} ev-blur={onchangeUsername}/></td>
          </tr>
          <tr>
            <td><label for="password">API Token:</label></td>
            <td><input value={new InputInitializeHook(data.password)} type="text" className="password" name="password" ev-keydown={onchangePassword} ev-blur={onchangePassword}/></td>
          </tr>
          <tr>
            <td><label for="serverRoot">Page ID:</label></td>
            <td><input value={new InputInitializeHook(data.serverRoot || '')} type="text" className="serverRoot" name="serverRoot" placeholder="Default: page ID  Example: 8675309" ev-keyup={onchangeServerRoot} ev-blur={onchangeServerRoot}/></td>
          </tr>
          <tr><td></td><td>
            <span className="status">{
              data.syncing
                ? '↻ Syncing...'
                : (data.error
                  ? <span>✘ Error!</span>
                  : <span>✓ all good</span>
                )
            }</span>
            <a href="#" className="btn openOptions" ev-click={(e) => {
              e.preventDefault()
              var options = e.target.parentNode.querySelector('.options')
              if (options.classList.contains('open')) {
                e.target.classList.remove('active')
                options.classList.remove('open')
              } else {
                e.target.classList.add('active')
                options.classList.add('open')
              }
            }}>Options</a>
            <a href="#" className={'btn forceSync ' + (data.syncing ? 'disabled' : '')} ev-click={() => !data.syncing && ctl.sync()}>Sync now</a>
            <div className="status-details">{data.error
              ? data.error
              : data.syncing === 'initial'
                ? 'Syncing from scratch. This may take a longer than usual...'
                : 'Last synchronized: ' + (data.lastSync ? humanizeDuration(Date.now() - data.lastSync, {largest: 1, round: true}) + ' ago' : 'never')}</div>
            <div className="options">
              <formgroup>
                <h4>Sync folder</h4>
                <input type="text" disabled placeholder="*Root folder*" value={rootPath} /><br/>
                <a href="" title="Reset synchronized folder to create a new one" className={'btn resetRoot ' + (data.syncing ? 'disabled' : '')} ev-click={() => {
                  !data.syncing && ctl.update({...data, localRoot: null})
                }}>Reset</a>
                <a href="#" title="Set an existing folder to sync" className={'btn chooseRoot ' + (data.syncing ? 'disabled' : '')} ev-click={(e) => {
                  e.preventDefault()
                  ctl.pickFolder()
                }}>Choose folder</a>
              </formgroup>
              <formgroup>
                <h4>Remove account</h4>
                <a href="#" className="btn remove" ev-click={(e) => {
                  e.preventDefault()
                  ctl.delete()
                }}>Delete this account</a>
              </formgroup>
            </div>
          </td></tr>
        </table>
      </form>
    </div>
  }

  setData (data) {
    this.server = data
  }

  getData () {
    return JSON.parse(JSON.stringify(this.server))
  }

  getLabel () {
    let data = this.getData()
    return data.username + '@' + data.url
  }

  normalizeServerURL (input) {
    // let serverURL = url.parse(input)
    // let indexLoc = serverURL.pathname.indexOf('wiki')
    // return url.format({
    //   protocol: serverURL.protocol
    //   , auth: serverURL.auth
    //   , host: serverURL.host
    //   , port: serverURL.port
    //   , pathname: serverURL.pathname.substr(0, ~indexLoc ? indexLoc : undefined) +
    //             (!~indexLoc && serverURL.pathname[serverURL.pathname.length - 1] !== '/' ? '/' : '')
    // })
    return input;
  }

  async syncStarted() {
    console.log("Sync started, loading bookmarks");
    let [bookmarks, body] = await this.loadBookmarks()
    this.cache = {
      bookmarks, body
    }
  }

  async syncCompleted() {
    console.log("Sync stopped, saving bookmarks");
    await this.saveBookmarks(this.cache.bookmarks, this.cache.body)
  }

  async pullBookmarks () {
    console.log('Fetching bookmarks', this.server)
    let bookmarks = this.cache.bookmarks;
    console.log('Received bookmarks from server', bookmarks)
    return bookmarks
  }

  async createBookmark (bm) {
      if (!~['https:', 'http:', 'ftp:'].indexOf(url.parse(bm.url).protocol)) {
          return false
      }

      console.log("Updating bookmark ", bm);

      bm.id = ConfluenceAdapter.uuidv4();
      this.cache.bookmarks.push(bm);
      return bm;
  }

  async updateBookmark (remoteId, newBm) {
    if (!~['https:', 'http:', 'ftp:'].indexOf(url.parse(newBm.url).protocol)) {
      return false
    }

    console.log("Updating bookmark ", remoteId, " with ", newBm)

    this.cache.bookmarks = this.cache.bookmarks.map((item) => {
      if (remoteId === item.id) {
        return newBm;
      } else {
        return item;
      }
    });
  }

  async removeBookmark (remoteId) {
    console.log("Removing bookmark ", remoteId);
    this.cache.bookmarks = this.cache.bookmarks.filter((bm) => bm.id !== remoteId);
  }

  async loadBookmarks() {
    const getUrl = this.normalizeServerURL(this.server.url)
      + '?expand=body.atlas_doc_format,version,body.storage'
    var response
    try {
      response = await fetch(getUrl, {
        headers: {
          Authorization: 'Basic ' + btoa(this.server.username + ':' + this.server.password)
        }
      })
    } catch (e) {
      throw new Error('Network error: Check your network connection and your account details')
    }

    if (response.status === 401) {
      throw new Error('Couldn\'t authenticate for removing bookmarks from the server.')
    }
    if (response.status !== 200) {
      let txt = await res.text()
      console.log("res body: " + txt)
      throw new Error('Failed to retrieve bookmarks from server')
    }

    let json = await response.json()

    let doc = JSON.parse(json.body.atlas_doc_format.value);
    let [bookmarks, dirty] = ConfluenceAdapter.atlasDocToBookmarkList(doc);
    if (dirty) {
      console.log("Detected dirty bookmarks, saving with new ids")
      await this.saveBookmarks(bookmarks, json)
    }
    console.log("bookmarks: ", bookmarks);
    return [bookmarks, json]
  }

  async saveBookmarks (bookmarks, body) {
    console.log("saving bookmarks: " + JSON.stringify(bookmarks));
    let doc = ConfluenceAdapter.bookmarksToStorageFormatString(bookmarks);
    if (doc === body.body.storage.value) {
      console.log("No change detected, skipping saving")
      return;
    }
    body.body.storage.value = doc;
    delete body.body.atlas_doc_format;
    body.version.number += 1;

    const saveUrl = this.normalizeServerURL(this.server.url);
    var res
    try {
      res = await fetch(saveUrl, {
        method: 'PUT'
        , body: JSON.stringify(body)
        , headers: {
          Authorization: 'Basic ' + btoa(this.server.username + ':' + this.server.password),
          "Content-Type": "application/json"
        }
      })
    } catch (e) {
      throw new Error('Network error: Check your network connection and your account details')
    }

    if (res.status === 401) {
      throw new Error('Couldn\'t authenticate for saving a bookmark on the server.')
    }
    if (res.status !== 200) {
      let txt = await res.text()
      console.log("res body: " + txt)
      throw new Error('Saving a bookmark on the server failed: ' + bm.url)
    }
    let txt = await res.text()
    console.log("res body: " + txt)
    console.log("bookmarks saved successfully")
  }

  static atlasDocToBookmarkList(doc) {
    const currentPath = [];
    let result = [];
    let lastHeadingLevel = 0;
    let dirty = false;
    doc.content.forEach((item) => {
      console.log("item: " + JSON.stringify(item));
      if ("bulletList" === item.type) {
        item.content.forEach((listItem) => {
          let title, link, id
          if (listItem.content[0].content) {
            title = listItem.content[0].content[0].text;
            link = listItem.content[0].content[0].marks[0].attrs.href;
          } else if (listItem.content[0].type === "confluenceUnsupportedInline") {
            let xml = new DOMParser().parseFromString(listItem.content[0].attrs.cxhtml, "text/xml");
            console.log("parsed xml: ", listItem.content[0])
            link = decodeURI(xml.documentElement.getAttribute("href"))
            title = xml.documentElement.textContent
          }
          if (link.indexOf("#") > 0) {
            id = link.split("#").slice(-1)[0];
            link = link.substr(0, link.lastIndexOf('#'))
          } else {
            id = ConfluenceAdapter.uuidv4();
            dirty = true
          }

          let path = "/" + currentPath.map((p) => p.replace(/[/]/g, '\\/')).join("/");
          if (path === "/") {
            path = "";
          }
          result.push(new Bookmark(id, null, link, title, path));
        });
      } else if ("heading" === item.type) {
        let title = item.content[0].text;
        let level = item.attrs.level;
        if (level > lastHeadingLevel) {
          currentPath.push(title);
        } else if (level === lastHeadingLevel) {
          currentPath.pop();
          currentPath.push(title);
        } else {
          currentPath.pop();
          if (currentPath.length) {
              currentPath.pop();
          }
          currentPath.push(title);
        }
        lastHeadingLevel = level;
      }
    });
    return [result, dirty];
  }

  static bookmarksToStorageFormatString(bookmarks) {
    bookmarks.sort((bm1, bm2) => {
      let path1 = bm1.path.toUpperCase();
      let path2 = bm2.path.toUpperCase();
      if (path1 < path2) {
        return -1;
      } else if (path1 > path2) {
        return 1;
      } else {
        return 0;
      }
    });

    let result = "";
    let items = []
    let lastPath = "/";
    bookmarks.forEach((bm) => {
      if (bm.path !== lastPath) {
        if (items.length) {
          result += "<ul>" + items.join("") + "</ul>";
        }
        result += ConfluenceAdapter.newDocHeading(bm);
        items = []
        lastPath = bm.path;
      }
      items.push(ConfluenceAdapter.bookmarkToListItem(bm));
    });
    if (items.length) {
      result += "<ul>" + items.join("") + "</ul>";
    }
    console.log("storage format: ", result);
    return result;
  }

  static bookmarkToListItem(bm) {
    let url = bm.url.replace(/&/g, '&amp;');
    let title = bm.title.replace(/&/g, '&amp;');
    return '<li><a href="' + url + '#' + bm.id + '">' + title + '</a></li>';
  }

  static newDocHeading(bm) {
    let path = ConfluenceAdapter.decodeAndSplitPath(bm.path);
    let level = path.length - 1;
    if (level > 0) {
      return "<h" + level + ">" + path.splice(-1)[0] + "</h" + level + ">";
    } else {
      return "";
    }
  }

  static uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static decodeAndSplitPath(path) {
    let pathArr = reverseStr(path)
      .split(/[/](?![\\])/)
      .reverse()
      .map(str => reverseStr(str))
    return pathArr.map((p) => p.replace(/[\\][/]/g, '/'))
  }
}

class InputInitializeHook {
  constructor (initStr) { this.initStr = initStr }
  hook (node, propertyName, previousValue) {
    if (typeof previousValue !== 'undefined') return
    node[propertyName] = this.initStr
  }
}
