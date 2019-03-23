import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HomePage } from './home.page';

import { SimplemdeModule, SIMPLEMDE_CONFIG } from 'ng2-simplemde/no-style';
import { NoteContentComponent } from '../components/note-content/note-content.component';
import { PouchdbService } from '../services/pouchdb.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomePage
      }
    ]),
    SimplemdeModule.forRoot({
      provide: SIMPLEMDE_CONFIG,
      // config options see https://github.com/sparksuite/simplemde-markdown-editor
      useValue: {
        "autoDownloadFontAwesome": false,
        "autofocus": true, 
        "blockStyles": {
          "italic": "_"
        },
        "insertTexts": {
          "image": ["![](https://", ")"],
          "link": ["[", "](https://)"] 
        },
        "placeholder": 
          "# Level 1 title"
          + "\n## Level 2 title"
          + "\n\n*italic*" 
          + "\n**bold**"
          + "\n~~strikethrough~~"
          + "\n> Quote"
          + "\n\n* Generic list item"
          + "\n1. Numbered list item"
          + "\n\n`return \"some code\";`"
          + "\n```\nvar multi-line-code = \"Hello world\";\nalert(multi-line-code);\n```"
          + "\n[link text](https://www.messorganizer.com)"
          + "\n![](https://www.messorganizer.com/image.png)", 
        "spellChecker": false,
        "status": false,
        "toolbar": false
      }
    })
  ],
  declarations: [
    HomePage,
    NoteContentComponent
  ],
  providers: [
    PouchdbService
  ]
})
export class HomePageModule {}
