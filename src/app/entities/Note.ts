
export class Note {
    public _id: string;
    public content: string;
    public type: string;

    public constructor(noteRaw?: any) {
        if (noteRaw != null) {
            this._id = noteRaw['id'];
            this.content = noteRaw['content'];
            this.type = noteRaw['type'];
        }
    }
}