import { Component } from '@angular/core';
import { Note } from '../../../app/entities/Note';
import { PouchdbService } from '../../services/pouchdb.service';

@Component({
  selector: 'note-content',
  templateUrl: './note-content.component.html',
  styleUrls: ['./note-content.component.scss'],
})
export class NoteContentComponent {

  noteText: string;
  value: string;

  constructor(public pouchDb: PouchdbService) {
    console.log('Hello NoteContentComponent Component');
    this.noteText = 'Hello World';
    this.addNote();
  }

  addNote() {
    let remoteCouch = false;
    let note: Note = new Note();

    note = {
      "_id": "note." + new Date().toISOString(),
      "type": "note",
      "content": "bla",
    };
    console.log(note);
    this.pouchDb.post(note);
    // db.put(note, function callback(err, result) {
    //   if (!err) {
    //     console.log('SUCCESS: Added note.');
    //   }
    // });
  }

}
