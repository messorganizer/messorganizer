import { Component } from '@angular/core';
import { Note } from '../../../app/entities/Note';
import { PouchdbService } from '../../services/pouchdb.service';

@Component({
  selector: 'note-content',
  templateUrl: './note-content.component.html',
  styleUrls: ['./note-content.component.scss'],
})
export class NoteContentComponent {

  noteId: string;
  noteRev: string;
  noteText: string;

  constructor(public pouchDb: PouchdbService) {
    console.log('Displaying note content');
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
  }

  updateNote(note) {
    this.pouchDb.put(note);
  }
}
