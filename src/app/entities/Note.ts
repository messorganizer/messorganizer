
export class Note {
    public id: string;
    public text: string;
    public type: string;

    public constructor(noteRaw?: any) {
        if (noteRaw != null) {
            this.id = noteRaw['id'];
            this.text = noteRaw['text'];
            this.type = noteRaw['type'];
        }
    }
}