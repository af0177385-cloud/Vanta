let productos = []

let input_buscador = document.getElementById("buscador")

let boton_agregar_productos = document.getElementById("agregar_productos")
let mostrar_productos = document.getElementById("mostrar_productos")
let formulario_productos = document.getElementById("formulario_productos")

let input_imagen = document.getElementById("input_imagen")
let input_producto = document.getElementById("input_producto")
let input_descripcion = document.getElementById("input_descripcion")
let input_precio = document.getElementById("input_precio")

let cancelar_producto = document.getElementById("cancelar_producto")

let tarjetas = document.getElementById("tarjetas")

async function cargar_productos() {
    const response = await fetch ("http://localhost:4000/productos")
    const datos = await response.json()

    productos = datos.mensaje
    console.log(productos)
}
cargar_productos()

async function guardar_supabase(producto) {
    const response = await fetch("http://localhost:4000/producto",{
        headers: {
            "Content-Type" : "application/json"
        },
        method : "POST",
        body: JSON.stringify(producto)
    })

    const datos = await response.json()
    console.log(datos)

    return datos
}

async function eliminar_producto_supabase(id) {
    const response = await fetch(`http://localhost:4000/producto/${id}`,{
        method : "DELETE",
    })

    const datos = await response.json()
    console.log(datos)
}

async function enviar_imagen(formulario) {
    const response = await fetch("http://localhost:4000/imagen_url", {
        method: "POST",
        body: formulario
    })

    const datos = await response.json()
    console.log(datos.mensaje)

    return datos.mensaje
}

async function editar_producto_supabase(id,producto_actulizado) {
   const response = await fetch(`http://localhost:4000/producto/${id}`,{
        headers: {
            "Content-Type": "application/json"
        },
        method : "PATCH",
        body: JSON.stringify(producto_actulizado)
    })

    const datos = await response.json()
    console.log(datos)
} 

function crear_tarjeta(producto) {

    console.log(producto)

        let id = producto.id
        
        let imag = document.createElement("img")
        let tarjeta = document.createElement("div")
        let titulo = document.createElement("h2")
        let description = document.createElement("p")
        let valor = document.createElement("p")
        let eliminar = document.createElement("button")
        let editar = document.createElement("button")

        tarjeta.className = "tarjeta"
        eliminar.className = "eliminar_tarjeta"
        editar.className = "editar_tarjeta"

        imag.src = producto.imagen_url
        titulo.textContent = producto.nombre
        description.textContent = producto.descripcion
        valor.textContent = "$ " + producto.precio.toLocaleString("es-CO")
        eliminar.textContent = "eliminar"
        editar.textContent = "editar"
       
        tarjeta.appendChild(imag)
        tarjeta.appendChild(titulo)
        tarjeta.appendChild(description)
        tarjeta.appendChild(valor)
        tarjeta.appendChild(eliminar)
        tarjeta.appendChild(editar)
        tarjetas.appendChild(tarjeta)

//ELIMINAR LA TARJETA DE ARRAY Y INTERFAZ.

       eliminar.addEventListener("click", function(){

          eliminar_productos(id)

          tarjeta.remove()
        })

//EDITAR ARRAY Y ACTUALIZAR LOCALSTORAGE    

        let editando = false

        editar.addEventListener("click", function(){

        if(editando === false){
        
          let variables = editar_productos(id,tarjeta)
          
          editando = true
         

        variables.guardar.addEventListener("click", function(){

           let elementos_tarjeta = {
                                   titulo, 
                                   description, 
                                   valor,
           }
        
            guardar_editar(variables,
                          elementos_tarjeta
                       )

            editando = false
        })

        variables.cancelar.addEventListener("click", function(){

               variables.input_producto.remove()
               variables.descripcion.remove()
               variables.precio.remove()
               variables.guardar.remove()
               variables.cancelar.remove()

               editando = false

        })        
     }
  })
}

async function eliminar_productos(id){

    const eliminar_producto = await eliminar_producto_supabase(id)

    productos = productos.filter(function(elementos){
        return elementos.id !== id
    })

    console.log(eliminar_producto)
}

function editar_productos(id, tarjeta){

            let editar_tarjeta = productos.find(function(objeto){
                return objeto.id === id
            })

            if(editar_tarjeta){

                let input_producto = document.createElement("input")
                let descripcion = document.createElement("textarea")
                let precio = document.createElement("input")
                let guardar = document.createElement("button")
                let cancelar = document.createElement("button")
                
                input_producto.value = editar_tarjeta.nombre
                descripcion.value = editar_tarjeta.descripcion
                precio.value = editar_tarjeta.precio
                guardar.textContent = "guardar"
                cancelar.textContent = "cancelar"

                tarjeta.appendChild(input_producto)
                tarjeta.appendChild(descripcion)
                tarjeta.appendChild(precio)
                tarjeta.appendChild(guardar)
                tarjeta.appendChild(cancelar)

                return {
                     editar_tarjeta,
                     input_producto,
                     descripcion,
                     precio,
                     guardar,
                     cancelar
                }
            }
        }

async function guardar_editar(variables,
                        elementos_tarjeta
){

                let error = false

                if(variables.input_producto.value === ""){
                    variables.input_producto.style.border = "2px solid red"
                    error = true
                }
 
                if(variables.descripcion.value === ""){
                    variables.descripcion.style.border = "2px solid red"
                    error = true
                }

                if (variables.precio.value === ""){
                     variables.precio.style.border = "2px solid red"
                     error = true
                }

                if(isNaN(Number(variables.precio.value)) || variables.precio.value <= 0){
                    variables.precio.style.border = "2px solid red"
                   variables.precio.value = "solo numeros mayores a 0"
                    error = true
                }

                if(error){
                    return
                }

                let producto_actualizado = {
                    nombre: variables.input_producto.value,
                    descripcion: variables.descripcion.value,
                    precio: Number(variables.precio.value)
                }

                await editar_producto_supabase(variables.editar_tarjeta.id,producto_actualizado)


                
                
                variables.editar_tarjeta.nombre = variables.input_producto.value
                variables.editar_tarjeta.descripcion = variables.descripcion.value
                variables.editar_tarjeta.precio = Number(variables.precio.value)
                 
                elementos_tarjeta.titulo.textContent = variables.editar_tarjeta.nombre
                elementos_tarjeta.description.textContent = variables.editar_tarjeta.descripcion
                elementos_tarjeta.valor.textContent = "$ " + variables.editar_tarjeta.precio.toLocaleString("es-CO")

                variables.input_producto.remove()
                variables.descripcion.remove()
                variables.precio.remove()
                variables.guardar.remove()
                variables.cancelar.remove()
                }

async function guarda_productos(array,imagen,nombre,descripción,precio) {

    const producto = [{
        "imagen_url": imagen,
        "nombre": nombre,
        "descripcion" : descripción,
        "precio" : precio
    }]

    const producto_id = await guardar_supabase(producto)
    const elemento = producto_id.mensaje[0]

    array.push(elemento)
    crear_tarjeta(elemento)
} 

function mostrar_todos_los_productos(){

    tarjetas.innerHTML= ""

    productos.forEach(function(producto) {

        crear_tarjeta(producto)
    })
}

function buscador(array){

    let resultado = array.filter(function(elementos){
        return elementos.nombre.trim().toLowerCase().includes(input_buscador.value.trim().toLowerCase())
    })

    resultado.forEach(function(producto){
        crear_tarjeta(producto)
    })
}
    
mostrar_productos.addEventListener("click",function(){
    mostrar_todos_los_productos()
})

boton_agregar_productos.addEventListener("click",function(){
    formulario_productos.style.display = "flex";
    boton_agregar_productos.style.display = "none"
    mostrar_productos.style.display ="none"
})

cancelar_producto.addEventListener("click",function(){
    formulario_productos.style.display = "none";
    boton_agregar_productos.style.display = "flex"
    mostrar_productos.style.display = "flex"
})

formulario_productos.addEventListener("submit", async function(event){

event.preventDefault()

    mostrar_productos.style.display ="flex"

    let error  = false

    if(input_imagen.files.length === 0){
        input_imagen.style.border = "2px solid red"
        error = true
    }
    else{
        input_imagen.style.border = ""
    }

    if(input_producto.value.trim() === ""){
       input_producto.style.border = "2px solid red"
       error = true
    }
    else{
        input_producto.style.border = ""
    }

    if (input_descripcion.value === ""){
        input_descripcion.style.border = "2px solid red"
        error = true
    }
    else{
        input_descripcion.style.border = ""
    }
    
    if(input_precio.value === ""){
        input_precio.style.border = "2px solid red"
        error = true
    }
    else{
        input_precio.style.border = ""
    }
    
    if( isNaN(Number(input_precio.value))){
        input_precio.style.border = "2px solid red"
        error = true
    } 

    if(input_precio.value <= 0){
        input_precio.style.border = "2px solid red"
        error = true
    }

    if(error){
        console.log(error)
        return
    }
    
    let imagen = input_imagen.files[0]
    let nombre = input_producto.value
    let descripcion = input_descripcion.value
    let precio = Number(input_precio.value)

    const formulario = new FormData()

    formulario.append("imagen", imagen)

    const imagen_url = await enviar_imagen(formulario)

    guarda_productos(productos,
                     imagen_url,
                     nombre,
                     descripcion,
                     precio)


    formulario_productos.style.display = "none"
    boton_agregar_productos.style.display = "flex"

    input_imagen.value= ""
    input_producto.value = ""
    input_descripcion.value = ""
    input_precio.value = ""
})

input_buscador.addEventListener("input", function(){

    tarjetas.innerHTML = ""

    buscador(productos)
})
