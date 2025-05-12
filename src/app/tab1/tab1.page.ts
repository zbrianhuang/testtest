import { Component ,OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { Observable } from 'rxjs'; // Optional for typing
import { catchError } from 'rxjs/operators'; // Optional for error handling
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
interface SheetMusic {
  title: string;
  author: string;
  thumbnail: string;//png, jpg
  redirect:string;//filepath to pdf me thinks
}
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit { // Implement OnInit

  sheets: SheetMusic[] = [];
  isLoading: boolean = true; // Flag for loading state
  errorLoading: boolean = false; // Flag for errors


  uploadTitle: string = '';
  uploadAuthor: string = '';
  selectedFile: File | null = null;
  selectedFileName: string = ''; // To display the selected file name
  router: any;


  constructor(
    private http: HttpClient,
        private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.loadSheetMusicData();
  }
  test(){
    alert(":)");
  }
  async upload_notif(param:string){

    const toast = await this.toastController.create({
      message: 'Sheet Music Successfully updated!',
      duration: 2000,
      color: 'success',
    });
    toast.present();
  
  }
  loadSheetMusicData() {
    this.isLoading = true;
    this.errorLoading = false;
    const dataUrl = 'assets/data/sheetmusic.json'; // Path to your JSON

    this.http.get<SheetMusic[]>(dataUrl)
      .pipe(
        catchError(err => {
          console.error("Error loading sheet music data:", err);
          this.errorLoading = true;
          this.isLoading = false;
          return []; // Return empty array on error or rethrow
        })
      )
      .subscribe(data => {
        this.sheets = data;
        this.isLoading = false;
      });
  }









}



