// Originally taken from https://github.com/bapatel1/angular-cli-pouchdb-couchdb

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// the pouchdb-adapter file/class in the same folder
import { PouchDbAdapter } from './pouchdb.adapter';

// TODO extract into a config file / option
const COUCHDB_BASEURL = '127.0.0.1:5984/mess';

@Injectable({
  providedIn: 'root'
})
export class PouchdbService {

  // handler for the adapter class
  private _pouchDbAdapter: PouchDbAdapter;

  // rxjs observables to broadcast sync status
  syncStatus: Observable<boolean>;
  couchdbUp: Observable<boolean>;

  // URL of CouchDB (hardwired above)
  remoteCouchDBAddress: string = COUCHDB_BASEURL;

  // initiate adapter class and hook up the observables
  constructor() {
    this._pouchDbAdapter = new PouchDbAdapter(COUCHDB_BASEURL);

    this.syncStatus = this._pouchDbAdapter.syncStatus.asObservable();
    this.couchdbUp = this._pouchDbAdapter.couchDbUp.asObservable();
  }

  // wrapper for the get 20docs method in the adpater class
  get20Docs(): Promise<any> {
    return Promise.resolve(this._pouchDbAdapter.get20Docs());
  }

  post(doc): Promise<any> {
    return this._pouchDbAdapter.post(doc);
  }

  replicateTo(): Promise<any> {
    return this._pouchDbAdapter.replicateToCouchDB();
  }

}