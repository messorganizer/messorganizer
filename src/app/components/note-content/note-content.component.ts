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
  }

  addNote() {
    let remoteCouch = false;
    let note: Note = new Note();

    note.id = "note." + new Date().toISOString();
    note.text = this.value;
    // let note = {
    //   "_id": "note." + new Date().toISOString(),
    //   "type": "note",
    //   "content": text,
    // };
    console.log(note);
    this.pouchDb.post(note);
    // db.put(note, function callback(err, result) {
    //   if (!err) {
    //     console.log('SUCCESS: Added note.');
    //   }
    // });
  }

}
