import { Component, OnInit,  Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from "ngx-toastr";
import { Album, Cancion } from '../album';
import { AlbumService } from '../album.service';
import { Subscription } from 'rxjs';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.css']
})
export class AlbumListComponent implements OnInit {

  constructor(
    private albumService: AlbumService,
    private router: ActivatedRoute,
    private toastr: ToastrService,
    private routerPath: Router
  ) { }

  userId: number
  token: string
  albumes: Array<Album>
  cancionesAlbum: Array<Cancion>
  mostrarAlbumes: Array<Album>

  albumFiltradoArtista: Array<Album>
  albumFiltradoTitulo: Array<Album>
  albumSeleccionado: Album
  indiceSeleccionado: number
  longitudInterpretes: number

  scroll: boolean;
  fixedStyle: object = {"position": "fixed"};
  display: object = {"display": "none"};
  sub: Subscription;
  albums: Album[];
  artists: string[] = [];
  performers: string[]  = [];
  generosLista:string[]=[];
  generosListaFiltrada:string[]=[];

  finalArtista: Album[] = [];
  performer: string;
  labels: string[];
  genres: string[];
  filteredAlbums: Album[] = [];
  filterValues: { [filter: string]: string } = {
    artist: "",
    genre: "",
    label: ""
  };
  openForm: boolean = false;

  private _labelFilter: string;
  get labelFilter(): string {
    return this._labelFilter;
  }
  set labelFilter(value: string) {
    this._labelFilter = value;
    this.filterValues.label = value
    this.filteredAlbums = this.performFilters();
  }

  private _artistFilter: string;
  get artistFilter(): string {
    return this._artistFilter;
  }
  set artistFilter(value: string) {
    this._artistFilter = value;
    this.filterValues.artist = value
    this.filteredAlbums = this.performFilters();
  }

  performFilters(): Album[] {
    let albums: Album[] = []

    if (this.filterValues.artist === "" && this.filterValues.genre === "" && this.filterValues.label === "") {
      return albums = this.albums;
    }

    if (this.filterValues.label !== "") {
      this.performLabelFilter().forEach(x=> albums.push(x));
    }

    if (this.filterValues.artist !== "") {
      this.performArtistFilter().forEach(x=> albums.push(x));
    }
    if (this.filterValues.genre !== "") {
      this.performGenreFilter().forEach(x=> albums.push(x));
    }

    return [...new Set(albums)].sort((a, b) => (a.titulo < b.titulo ? -1 : 1));
  }


  performLabelFilter(): Album[] {
    return this.albums.filter((album: Album) =>
      album.titulo.includes(this.filterValues.label));
  }

  performArtistFilter(): Album[] {
    console.log(this.albums)
    let cuentaAlbum = this.albums.filter((album: Album) => album.interpretes.includes(this.filterValues.artist));
    return cuentaAlbum
  }

  performGenreFilter(): Album[] {
    return this.albums.filter((album: Album) =>
      album.titulo.includes(this.filterValues.genre));
  }

  showForm() {
    this.openForm = true;
  }

  hideForm() {
    this.openForm = false;
  }


  //************** */
  onChangeGenre(event : any){

  }


  ngOnInit() {
    if(!parseInt(this.router.snapshot.params.userId) || this.router.snapshot.params.userToken === " "){
      this.showError("No hemos podido identificarlo, por favor vuelva a iniciar sesión.")
    }
    else{
      this.userId = parseInt(this.router.snapshot.params.userId)
      this.token = this.router.snapshot.params.userToken
      this.getAlbumes();
      this.sub = this.albumService.getAlbumes(this.userId, this.token).subscribe(albums => {
      this.albums = albums.sort( (a, b) => (a.titulo < b.titulo ? -1 : 1));
      this.getInterpretes();
      this.getGeneros();
      this.filteredAlbums = this.albums;
      //this.artists = [...new Set(this.albums.map(a => a.interpretes).map(n =>n[0]))].sort();
      });
    }
  }

  getInterpretes(): void{
    for (let i of this.albums){
      this.sub = this.albumService.getCancionesAlbum(i.id, this.token).subscribe(canciones => {
        this.cancionesAlbum = canciones.sort( (a, b) => (a.titulo < b.titulo ? -1 : 1));
        let result = canciones.map(a => a.interprete)
        this.performers = this.removeDuplicates(this.performers.concat(result))
        i.interpretes = result
        this.finalArtista.push(i)
      });
    }
  }

  getGeneros(): void{
    for (let i of this.albums){
      this.sub = this.albumService.getCancionesAlbum(i.id, this.token).subscribe(generosActuales => {
        this.cancionesAlbum = generosActuales.sort( (a, b) => (a.genero < b.genero ? -1 : 1));
        let resultGeneros = generosActuales.map(a => a.genero)
        this.generosLista = this.removeDuplicates(this.generosLista.concat(resultGeneros))  //En generosLista[] queda almacenados los generos de los albumes actuales (de las canciones de estos)
        this.generosListaFiltrada=this.generosLista
        console.log(this.generosLista)
        console.log(this.generosListaFiltrada)
      });
    }
  }

  removeDuplicates(data: string[]): string[]{
    return data.filter((value, index) => data.indexOf(value) === index);
  }

  getAlbumes():void{
    this.albumService.getAlbumes(this.userId, this.token)
    .subscribe(albumes => {
      this.albumes = albumes
      this.mostrarAlbumes = albumes
      if(albumes.length>0){
        this.onSelect(this.mostrarAlbumes[0], 0)
      }
    },
    error => {
      console.log(error)
      if(error.statusText === "UNAUTHORIZED"){
        this.showWarning("Su sesión ha caducado, por favor vuelva a iniciar sesión.")
      }
      else if(error.statusText === "UNPROCESSABLE ENTITY"){
        this.showError("No hemos podido identificarlo, por favor vuelva a iniciar sesión.")
      }
      else{
        this.showError("Ha ocurrido un error. " + error.message)
      }
    })

  }



  onSelect(a: Album, index: number){
    this.indiceSeleccionado = index
    this.albumSeleccionado = a
    this.albumService.getCancionesAlbum(a.id, this.token)
    .subscribe(canciones => {
      this.albumSeleccionado.canciones = canciones
    },
    error =>{
      this.showError("Ha ocurrido un error, " + error.message)
    })
  }

  buscarAlbum(busqueda: string){
    let albumesBusqueda: Array<Album> = []

    this.filteredAlbums.map( albu => {
      if( albu.titulo.toLocaleLowerCase().includes(busqueda.toLowerCase())){
        albumesBusqueda.push(albu)
      }
      if ( busqueda === "")
      this.ngOnInit();

    })
    this.filteredAlbums = albumesBusqueda
  }

  irCrearAlbum(){
    this.routerPath.navigate([`/albumes/create/${this.userId}/${this.token}`])
  }

  eliminarAlbum(){
    this.albumService.eliminarAlbum(this.userId, this.token, this.albumSeleccionado.id)
    .subscribe(album => {
      this.ngOnInit();
      this.showSuccess();
    },
    error=> {
      if(error.statusText === "UNAUTHORIZED"){
        this.showWarning("Su sesión ha caducado, por favor vuelva a iniciar sesión.")
      }
      else if(error.statusText === "UNPROCESSABLE ENTITY"){
        this.showError("No hemos podido identificarlo, por favor vuelva a iniciar sesión.")
      }
      else{
        this.showError("Ha ocurrido un error. " + error.message)
      }
    })
    this.ngOnInit()
  }

  showError(error: string){
    this.toastr.error(error, "Error de autenticación")
  }

  showWarning(warning: string){
    this.toastr.warning(warning, "Error de autenticación")
  }

  showSuccess() {
    this.toastr.success(`El album fue eliminado`, "Eliminado exitosamente");
  }
}
