// Originally taken from https://github.com/bapatel1/angular-cli-pouchdb-couchdb

import PouchDB from 'pouchdb';
import PouchDBAuthentication from 'pouchdb-authentication';
// import PouchDBQuickSearch from 'pouchdb-quick-search';
PouchDB.plugin(PouchDBAuthentication);
// PouchDB.plugin(PouchDBQuickSearch);
import { BehaviorSubject } from 'rxjs';

export class PouchDbAdapter {

    private _pouchDB: any;
    private _couchDB: any;
    private _couchDBURL: string;
    private _pouchDbName: string;
    private _username: string;
    private _password: string;
    private _isLoggedIn: boolean;

    // rxjs behaviour subjects to expose stats flags
    syncStatus = new BehaviorSubject<boolean>(false);
    couchDbUp = new BehaviorSubject<boolean>(false);

    constructor(couchDBBaseURL: string) {
        // TODO extract credentials into a config file / option
        this.setUsername("bert");
        this.setPassword("bert");

        this._couchDBURL = couchDBBaseURL + "_" + this.getUsername();
        console.log(this._couchDBURL);
        this._pouchDbName = "tinfoil" + '_' + this.getUsername();

        // init databases
        this._pouchDB = new PouchDB(this._pouchDbName);
        this._couchDB = new PouchDB(this._couchDBURL);
    }

    destroyPouchDB(): Promise<any> {
        return new Promise(resolve => {
            new PouchDB(this._pouchDbName).destroy()
            .then(function () {
                console.log('Local DB destroyed!');
            })
            .catch(function (error) {
                console.log("Error during PouchD destruction");
                console.log(error);
            });
        });
    }

    loginCouchDB(): Promise<any> {
        return new Promise(resolve => {
            this._couchDB.logIn(this.getUsername(), this.getPassword())
            .then(user => {
                console.log(user);
                return true;
            })
            .catch(error => {
                console.log("Error during CouchDB logout");
                console.log(error);
                return false;
            });
        });
    }

    logoutCouchDB(): Promise<any> {
        return new Promise(resolve => {
            this._couchDB.logOut()
            .then(result => {
                console.log("Logged out");
                this._isLoggedIn = false;
            })
            .catch(error => {
                console.log("Error during CouchDB logout");
                console.log(error);
            });
        });
    }

    replicateFromCouchDB(): Promise<any> {
        return new Promise(resolve => {
            this.loginCouchDB()
            .then(result => {
                this._pouchDB.replicate.from(this._couchDB, {
                    live: false,
                    retry: false,
                    since: 0,
                    query_params: {
                        'username': this.getUsername(),
                        'password': this.getPassword()
                    }
                })
                .on('paused', err => { this.syncStatusUpdate(); })
                .on('change', info => {
                    console.log('C2P CHANGE: ', info);
                    this.syncStatusUpdate();
                })
                .on('error', err => {
                    // TODO: Write error handling and display message to user
                    console.error('C2P Error: ', err);
                })
                .on('active', info => {
                    // TODO: Write code when sync is resume after pause/error
                    console.log('C2P Resume: ', info);
                });
            })
            .catch(error => {
                console.log("Error replicating FROM CouchDB");
                console.log(error);
            });
        });
    }

    replicateToCouchDB(): Promise<any> {
        return new Promise(resolve => {
            this.loginCouchDB()
            .then(result => {
                this._pouchDB.replicate.to(this._couchDB, {
                    live: false,
                    retry: false
                })
                .on('paused', err => { this.syncStatusUpdate(); })
                .on('change', info => {
                    console.log('P2C CHANGE: ', info);
                    this.syncStatusUpdate();
                })
                .on('error', err => {
                    // TODO: Write error handling and display message to user
                    console.error('P2C Error: ', err);
                })
                .on('active', info => {
                    // TODO: Write code when sync is resume after pause/error
                    console.log('P2C Resume: ', info);
                })
                .catch(error => {
                    console.log("Error during replication to CouchDB");
                    console.log(error);
                });
            })
            .catch(error => {
                console.log("Error replicating TO CouchDB");
                console.log(error);
            });
        });
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

    post(doc): void {
        var db = this._couchDB;
        db.logIn('bert', 'bert').then(function (batman) {
            console.log("I'm Batman.");
            return db.logOut();
        }).catch((error) => {
            console.log(error);
        });

        // return new Promise(resolve => {
        //     this._pouchDB.post(doc)
        //         .then((response => {
        //             resolve(response);
        //         }))
        //         .catch((error) => {
        //             console.log(error);
        //         });
        // });
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
    // are in sync. The way its buried in the JSON means some string
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
            xhr.open('GET', this._couchDBURL, true) + "_" + this.getUsername();
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

    public getUsername(): string {
        return this._username;
    }

    public getPassword(): string {
        return this._password;
    }

    public setUsername(username: string): void {
        this._username = username;
    }

    public setPassword(password: string): void {
        this._password = password;
    }
}
