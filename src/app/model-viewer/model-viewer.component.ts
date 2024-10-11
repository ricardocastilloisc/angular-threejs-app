import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

// Definición del componente Angular
@Component({
  selector: 'app-model-viewer',
  templateUrl: './model-viewer.component.html',
  styleUrls: ['./model-viewer.component.scss']
})
export class ModelViewerComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef; // Referencia al canvas donde se renderiza el modelo 3D

  private scene!: THREE.Scene; // Escena de Three.js
  private camera!: THREE.PerspectiveCamera; // Cámara en perspectiva
  private renderer!: THREE.WebGLRenderer; // Renderizador WebGL
  private currentObject!: THREE.Object3D | null; // Objeto 3D actual
  private isAnimating: boolean = true; // Nueva variable para controlar la animación

  shapes: string[] = ['cube', 'cone']; // Formas disponibles para cargar
  selectedColor: THREE.Color = new THREE.Color(0x0000ff); // Color seleccionado por defecto
  private gridXY!: THREE.GridHelper;  // Cuadrícula en el plano XY
  private gridXZ!: THREE.GridHelper;  // Cuadrícula en el plano XZ
  private gridYZ!: THREE.GridHelper;  // Cuadrícula en el plano YZ
  private axesHelper!: THREE.AxesHelper;  // Ejes XYZ

  // Colores disponibles para seleccionar
  colors = [
    { name: 'Azul', value: 0x0000ff },
    { name: 'Magenta', value: 0xff00ff },
    { name: 'Cian', value: 0x00ffff },
  ];

  constructor() {}

  ngOnInit() {
    this.initThreeJS(); // Inicializa Three.js
    this.changeShape('cube'); // Carga la forma por defecto (cubo)
    this.addCartesianGrid(); // Añadimos el plano cartesiano
  }

  // Añade cuadrículas y ejes a la escena
  private addCartesianGrid() {
    // Cuadrícula en el plano XY
    this.gridXY = new THREE.GridHelper(10, 10, 0xffffff, 0xffff00);
    this.gridXY.rotation.x = Math.PI / 2; // Giramos el grid para que esté en el plano XY
    this.scene.add(this.gridXY);

    // Cuadrícula en el plano XZ (sin rotación)
    this.gridXZ = new THREE.GridHelper(10, 10, 0xffffff, 0xffff00);
    this.scene.add(this.gridXZ); // Esta cuadrícula ya está en el plano XZ por defecto

    // Cuadrícula en el plano YZ
    this.gridYZ = new THREE.GridHelper(10, 10, 0xffffff, 0xffff00);
    this.gridYZ.rotation.z = Math.PI / 2; // Giramos el grid para que esté en el plano YZ
    this.scene.add(this.gridYZ);

    // Añadimos los ejes XYZ
    this.axesHelper = new THREE.AxesHelper(5); // Tamaño de los ejes
    this.scene.add(this.axesHelper);
  }

  // Cambia el color del objeto actual
  public changeColor({ value }: any) {
    const colorValue = parseInt(value, 16); // Convierte el valor hexadecimal a entero
    this.selectedColor.set(colorValue); // Establece el nuevo color seleccionado
    if (this.currentObject) {
      this.applyFaceColors(this.currentObject); // Aplica el nuevo color al objeto
      this.renderScene(); // Renderiza la escena de inmediato para aplicar el color
    }
  }

  // Renderiza la escena
  private renderScene() {
    this.renderer.render(this.scene, this.camera); // Renderiza la escena usando el renderizador y la cámara
  }

  // Inicializa Three.js y la escena
  private initThreeJS() {
    this.scene = new THREE.Scene(); // Crea una nueva escena
    this.camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000); // Configura la cámara
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement }); // Crea el renderizador
    this.renderer.setSize(400, 400); // Establece el tamaño del renderizador
    this.camera.position.z = 5; // Coloca la cámara
    this.animate(); // Inicia la animación.
  }

  // Función para animar la escena
  private animate() {
    if (this.isAnimating) { // Verifica si la animación está habilitada
      requestAnimationFrame(() => this.animate()); // Llama a animate nuevamente en el siguiente frame
      this.update(); // Actualiza la rotación del objeto
      this.renderer.render(this.scene, this.camera); // Renderiza la escena
    }
  }

  // Actualiza la rotación del objeto actual
  private update() {
    if (this.currentObject) {
      this.currentObject.rotation.y += 0.01; // Rota el objeto alrededor del eje Y
      this.currentObject.rotation.x += 0.01; // Rota el objeto alrededor del eje X
    }
  }

  // Cambia la forma del objeto actual
  public changeShape({ value }: any) {
    this.loadOBJ(value); // Carga un nuevo objeto en base al valor seleccionado
  }

  // Carga un objeto 3D desde un archivo OBJ
  private loadOBJ(shapeType: string) {
    const loader = new OBJLoader(); // Crea un nuevo cargador de OBJ
    const objUrl = `https://fastapi-app-79bt.onrender.com/shapes/${shapeType ? shapeType.toLowerCase() : 'cube'}`; // URL del objeto

    loader.load(objUrl, (object) => {
      if (this.currentObject) {
        this.scene.remove(this.currentObject); // Remueve el objeto actual de la escena
      }
      this.applyFaceColors(object); // Aplica los colores al nuevo objeto
      this.currentObject = object; // Establece el nuevo objeto como el objeto actual
      this.scene.add(object); // Añade el objeto a la escena
      this.renderScene(); // Renderiza la escena después de cargar el nuevo objeto
    }, undefined, (error) => {
      console.error(`Error al cargar el objeto: ${error}`); // Maneja errores en la carga
    });
  }

  // Aplica el color seleccionado a las caras del objeto
  private applyFaceColors(object: THREE.Object3D) {
    const colors = [
      new THREE.MeshBasicMaterial({ color: this.selectedColor }), // Material básico con el color seleccionado
    ];

    // Recorre todos los hijos del objeto y aplica el material si es un mesh
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = colors[0]; // Aplica el material al mesh
      }
    });
  }

  // Nueva función para detener la animación
  public stopAnimation() {
    this.isAnimating = false; // Cambia el estado de animación
  }

  // Nueva función para reanudar la animación
  public startAnimation() {
    if (!this.isAnimating) { // Solo reinicia si la animación estaba detenida
      this.isAnimating = true; // Cambia el estado de animación
      this.animate(); // Vuelve a iniciar la animación
    }
  }
}
