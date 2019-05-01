// Originally taken from https://github.com/bapatel1/angular-cli-pouchdb-couchdb

import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
// import PouchDBQuickSearch from 'pouchdb-quick-search';
PouchDB.plugin(PouchDBAuthentication);
// PouchDB.plugin(PouchDBQuickSearch);
import { BehaviorSubject } from 'rxjs';

export class PouchDbAdapter {

    public _pouchDB: any;
    public _couchDB: any;
    public _couchDBURL: string;
    public _pouchDbName: string;
    public _username: string;
    public _password: string;
    public _isLoggedIn: boolean;

    // rxjs behaviour subjects to expose stats flags
    syncStatus = new BehaviorSubject<boolean>(false);
    couchDbUp = new BehaviorSubject<boolean>(false);

    changeSyncStatus(value: boolean) {
        this.syncStatus.next(value);
    }

    changeUpStatus(value: boolean) {
        this.couchDbUp.next(value);
    }

    constructor(couchDBBaseURL: string) {
        // TODO extract credentials into a config file / option
        this._username = 'dev';
        this._password = 'dev';

        this._couchDBURL = "http://"
            + this._username
            + ":"
            + this._password
            + "@" + couchDBBaseURL;
        console.log(this._couchDBURL);
        this._pouchDbName = 'mess';

        // init databases
        this._pouchDB = new PouchDB(this._pouchDbName);
        this._couchDB = new PouchDB(this._couchDBURL);

        this.replicateFromCouchDBAndSync();
    }

    destroyPouchDB(): Promise<any> {
        return new Promise(resolve => {
            new PouchDB(this._pouchDbName).destroy()
                .then(function () {
                    console.log('Local DB destroyed!');
                })
                .catch(function (error) {
                    console.log('Error during PouchD destruction');
                    console.log(error);
                });
        });
    }

    loginCouchDB(): Promise<any> {
        return new Promise(resolve => {
            this._couchDB.logIn(this._username, this._password)
                .then(user => {
                    console.log('Login to CouchDB ok as ' + this._username);
                    resolve(true);
                })
                .catch(error => {
                    console.log('Error during CouchDB login');
                    console.log(error);
                    return false;
                });
        });
    }

    logoutCouchDB(): Promise<any> {
        return new Promise(resolve => {
            this._couchDB.logOut()
                .then(result => {
                    console.log('Logged out');
                    this._isLoggedIn = false;
                })
                .catch(error => {
                    console.log('Error during CouchDB logout');
                    console.log(error);
                });
        });
    }

    replicateFromCouchDBAndSync(): Promise<any> {
        return this.loginCouchDB()
            .then(result => {
                return this._pouchDB.replicate.from(this._couchDB, {
                    live: false,
                    retry: true,
                    query_params: {
                        'auth.username': this._username,
                        'auth.password': this._password
                    }
                })
                    .on('change', this.onSyncChange)
                    .on('paused', this.onSyncPaused)
                    .on('active', this.onSyncActive)
                    .on('denied', this.onSyncDenied)
                    .on('complete', this.onSyncCompleteLaunchTwoWaySync)
                    .on('error', this.onSyncError);
            })
            .catch(error => {
                console.log('Could not replicate FROM CouchDB');
                console.log(error);
            });
    }

    replicateToCouchDB(): Promise<any> {
        return this.loginCouchDB()
            .then(result => {
                return this._pouchDB.replicate.to(this._couchDB, {
                    live: true,
                    retry: true,
                    query_params: {
                        'auth.username': this._username,
                        'auth.password': this._password
                    }
                })
                    .on('change', this.onSyncChange)
                    .on('paused', this.onSyncPaused)
                    .on('active', this.onSyncActive)
                    .on('denied', this.onSyncDenied)
                    .on('complete', this.onSyncComplete)
                    .on('error', this.onSyncError);
            })
            .catch(error => {
                console.log('Could not login to replicate TO CouchDB');
                console.log(error);
            });
    }

    onSyncChange(info): void {
        console.log('change detected');
    }

    onSyncPaused(error): void {
        // replication paused (e.g. replication up to date, user went offline)
        console.log('replication paused');
        if (error) {
            console.log(error);
        }
    }

    onSyncActive(): void {
        // replicate resumed (e.g. new changes replicating, user went back online)
        console.log('replication resumed');
    }

    onSyncDenied(error) {
        // a document failed to replicate (e.g. due to permissions)
        console.log('document failed to replicate');
        console.log(error);
    }

    onSyncError(error): void {
        console.log('error replicating');
        console.log(error);
    }

    onSyncComplete(): void {
        console.log('replication complete');
    }

    onSyncCompleteLaunchTwoWaySync(): void {
        console.log('replication complete');
        console.log('starting 2-way sync');
        this.twoWaySync();
    }

    twoWaySync(): void {
        var opts = { live: true, retry: true };
        this._pouchDB.sync(this._couchDBURL, opts)
            .on('change', this.onSyncChange)
            .on('paused', this.onSyncPaused)
            .on('active', this.onSyncActive)
            .on('denied', this.onSyncDenied)
            .on('complete', this.onSyncComplete)
            .on('error', this.onSyncError);
    }

    // pretty basic and crude function
    // return a Promise with the first 20 docs from allDocs as is
    get20Docs(): Promise<any> {
        return new Promise(resolve => {
            this._pouchDB.allDocs({
                include_docs: true,
                limit: 20
            })
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    console.log(error);
                });
        });
    }

    post(doc): Promise<any> {
        return new Promise(resolve => {
            this._pouchDB.post(doc)
                .then((response => {
                    console.log('document created in pouchDB');
                }))
                .catch((error) => {
                    console.log(error);
                });
        });
    }

    put(doc): Promise<any> {
        return new Promise(resolve => {
            this._pouchDB.put(doc)
                .then((response => {
                    console.log('document updated in pouchDB');
                }))
                .catch((error) => {
                    console.log(error);
                });
        });
    }

    // function to call the below functions
    // then update the rxjs BehaviourSubjects with the 
    // results
    private syncStatusUpdate(): void {
        this.checkPouchCouchSync()
            .then((result) => {
                this.syncStatus.next(result);
            });
        this.checkCouchUp()
            .then((result) => {
                this.couchDbUp.next(result);
            });
    }

    // part of the JSON returned by PouchDB from the info() method
    // is 'update_seq'. When these numbers are equal then the databases
    // are in twoWaySync. The way its buried in the JSON means some string
    // functions are required to extract it
    private checkPouchCouchSync(): Promise<boolean> {
        // if both objects exist then make a Promise from both their
        // info() methods
        if (this._pouchDB && this._couchDB) {
            return Promise.all([this._pouchDB.info(), this._couchDB.info()])
                // using the 0 and 1 items in the array of two
                // that is produced by the Promise
                // Do some string trickery to get a number for update_seq
                // and return 'true' if the numbers are equal.
                .then((results: any[]) => {
                    return (Number(String(results[0]
                        .update_seq)
                        .split('-')[0])
                        ===
                        Number(String(results[1]
                            .update_seq)
                            .split('-')[0]));
                })
                // on error just resolve as false
                .catch((error) => false);
        } else {
            // if one of the PouchDB or CouchDB objects doesn't exist yet
            // return resolve false
            return Promise.resolve(false);
        }
    }

    // fairly self explanatory function to make a 
    // GET http request to the URL and return false
    // if an error status or a timeout occurs, true if 
    // successful.
    private checkCouchUp(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', this._couchDBURL, true) + '_' + this._username;
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            xhr.onerror = () => {
                resolve(false);
            };
            xhr.send();
        });
    }
}
