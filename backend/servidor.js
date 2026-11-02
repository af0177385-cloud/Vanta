const dotenv = require("dotenv")
const http = require("http")
const Busboy = require("busboy")

dotenv.config()

const supabase = require("@supabase/supabase-js")
const createClient = supabase.createClient
const cliente = createClient(process.env.SUPABASE_URL,process.env.CLAVE_SUPABASE )


function consultar_todo() {
    return cliente.from("productos").select("*")
}

function consultar_por_id(id) {
    return cliente.from("productos")
                  .select("*")
                  .eq("id",id)
}

function agregar_producto(producto){
    return cliente.from("productos")
                  .insert(producto)
                  .select()
}

function eliminar_producto(ids_eliminar){
    if(Array.isArray(ids_eliminar)){
            return cliente.from("productos")
                  .delete()
                  .in("id",ids_eliminar)
                  .select()
    }
    return cliente.from("productos")
                  .delete()
                  .eq("id",ids_eliminar)
                  .select()
}

function actualizar_producto(id,producto_actilizado){
    return cliente.from("productos")
                  .update(producto_actilizado)
                  .eq("id",id)
                  .select()
}

async function subir_imagen(ruta, imagen, tipo_imagen) {

    const resultado = await cliente.storage
        .from("productos")
        .upload(ruta, imagen, {
            contentType: tipo_imagen
        })

    return resultado
}

async function eliminar_imagen(ruta_imagen) {
    const resultado = await cliente.storage
        .from("productos")
        .remove([ruta_imagen])

    return resultado
}

function mensaje(respuesta, dato, status = 200){
    respuesta.setHeader("Content-Type","application/json")
    respuesta.setHeader("Access-Control-Allow-Origin", "https://vanta-1-zdyl.onrender.com")
    respuesta.statusCode = status
    respuesta.end(JSON.stringify({
        mensaje: dato
    }))
}

function manejo_errores(error,
                        respuesta,
                        mensaje_error = "error interno del servidor",
                        status = 500){
     console.log(error)
      if (error instanceof SyntaxError) {
        mensaje(respuesta, "JSON incorrecto", 400)
        return
        } 
                  
     mensaje(respuesta,mensaje_error,status)
}

function validacion_array(array){
    if(!(Array.isArray(array)) || array.length === 0){
        return true
    }
    return array.some(function(elemento){
        return typeof elemento !== "object" || 
                      elemento === null     ||
                Object.keys(elemento).length === 0 ||
                Array.isArray(elemento)      
    })
}

function validacion_objeto(body){
   return Array.isArray(body) ||
          body === null ||
          typeof body !== "object" ||
          Object.keys(body).length === 0  ||
          !(Object.keys(body).every(function(propiedad){
                return propiedad in propiedades()
            }))
}

function propiedades(){
    return {
                nombre: null,
                descripcion: null,
                precio: null,
                imagen_url: null
            }
}

function validacion_propiedades(array,reglas_propiedades){
    return array.every(function(objeto){
        return Object.keys(objeto).every(function(propiedades){
            return propiedades in reglas_propiedades
        })
    })
}

function validacion_valores_put(datos){
    function reglas_compartidas(objeto){
            return typeof objeto.nombre !== "string" ||
            objeto.nombre.trim().length === 0 ||
            typeof objeto.descripcion !== "string"||
            objeto.descripcion.trim().length === 0 ||
            !(Number.isFinite(objeto.precio)) ||
            objeto.precio < 0 ||
            typeof objeto.imagen_url !== "string" ||
            objeto.imagen_url.trim().length === 0
    }
    if(validacion_array(datos)){
        return true
    }

    if(Array.isArray(datos)){   
    return datos.some(function(objeto){
        return reglas_compartidas(objeto)
        }
    )
    }

    if(!(Array.isArray(datos)) && 
       typeof datos === "object" && 
       datos !== null){
        return reglas_compartidas(datos)
    }
    return false
}

function validacion_valores_patch(datos){

    return Object.keys(datos).some(function(propiedad){
        if(propiedad === "nombre"){
            return typeof datos.nombre !== "string" ||
                               datos.nombre.trim().length === 0
        }
        if(propiedad === "descripcion"){
            return typeof datos.descripcion !== "string"||
                               datos.descripcion.trim().length === 0 
        }
        if(propiedad === "precio"){
            return !(Number.isFinite(datos.precio)) ||
                               datos.precio < 0
        }
        if(propiedad === "imagen_url"){
            return typeof datos.imagen_url !== "string" ||
                               datos.imagen_url.trim().length === 0
        }
    })
}

function activar_validaciones(validacion_array,
                              validacion_propiedades,
                              validacion_valores,
                              array,
                              reglas_propiedades,
){
    return validacion_array(array) ||
           !validacion_propiedades(array,reglas_propiedades) ||
           validacion_valores (array)
}

function validacion_url(partes_url,respuesta){
    const id = Number(partes_url[2])

    if(partes_url.length !== 3){
        mensaje(respuesta,"ruta incorrecta",404)
        return true
        }
        
    if(!(Number.isFinite(id))  || 
        !(Number.isInteger(id)) || 
        id <= 0){
        mensaje(respuesta,"id incorrecto",400)
        return true
        }

        return false
}

function validacion_supabase(resultado,
                             respuesta,
                             nota = "el id no existe",
                             status = 404){
     if(resultado.error){
                 mensaje(respuesta,"error interno del servidor",500)
                 return true
                }

    if(resultado.data === null || resultado.data.length === 0){
                 mensaje(respuesta,nota,status)
                 return true
                }
   return false
}

function informacion_recibida(peticion){
        const promesa = new Promise (function(resolve,reject){
            
            let informacion_completa = ""

            peticion.on("error", function(error){
                resolve(error)
            })

            peticion.on("data",function(buffer){
                informacion_completa += buffer.toString()
            })

            peticion.on("end", function(){
                try{
                const body = JSON.parse(informacion_completa)
                resolve(body)
                }
                catch(error){
                    reject(error)
                }
            })
        })
        return promesa
}

const servidor = http.createServer(async function(peticion,respuesta){

    if (peticion.method === "OPTIONS") {
    respuesta.setHeader("Access-Control-Allow-Origin", "https://vanta-1-zdyl.onrender.com")
    respuesta.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
    respuesta.setHeader("Access-Control-Allow-Headers", "Content-Type")

    respuesta.statusCode = 200
    respuesta.end()
    return
    
    }else if(peticion.method === "GET" && peticion.url === "/productos"){
        try{
        const response = await consultar_todo()

        if(response.error){
            mensaje(respuesta,"error del servidor db",500)
            return
        }
        mensaje(respuesta,response.data)
        }
        catch(error){          
            manejo_errores(error,respuesta,"error interno del servidor")
        }
    }
    else if(peticion.method === "GET" && peticion.url.startsWith("/producto/")){
        const partes_url = peticion.url.split("/")
        const id = Number(partes_url[2])

        if(validacion_url(partes_url,respuesta)){
            return
        }

        try{
        const resultado = await consultar_por_id(id)

        if(validacion_supabase(resultado,respuesta)){
            return
        }
         
        mensaje(respuesta,resultado.data)
        }
        catch(error){
           manejo_errores(error,respuesta,"errror interno del servidor")
        }
    }else if(peticion.method === "POST" && peticion.url === "/producto"){

            try{
            const informacion_completa = await informacion_recibida(peticion)

            const reglas_propiedades = propiedades()

            if(activar_validaciones(validacion_array,
                        validacion_propiedades,
                        validacion_valores_put,
                        informacion_completa,
                        reglas_propiedades)){

                mensaje(respuesta,"datos incorrectos",400)
                return
            }

            const resultado = await agregar_producto(informacion_completa)

             if(resultado.error){
             mensaje(respuesta,"error interno del servidor",500)
             return
             }

             mensaje(respuesta,resultado.data)
             
             }
            catch(error){
                manejo_errores(error, respuesta)
            }
        
    }else if(peticion.method === "DELETE" && peticion.url.startsWith("/producto/")){

        console.log("ENTRÓ A LA RUTA DELETE")
        const partes_url = peticion.url.split("/")
        const id = Number(partes_url[2])

        if(validacion_url(partes_url,respuesta)){
            return
        }

        try{
            const resultado = await eliminar_producto(id)

            if(validacion_supabase(resultado,respuesta)){
                return
            }

            mensaje(respuesta,resultado.data)
            const imagen_url = resultado.data[0].imagen_url
            const ultima_ruta = imagen_url.split("/").pop()
            const ruta_imagen = decodeURIComponent(ultima_ruta)

            console.log(imagen_url)
            console.log(ruta_imagen)
            await eliminar_imagen(ruta_imagen)
        }
        catch(error){
            manejo_errores(error,respuesta)
        }
    }else if(peticion.method === "DELETE" && peticion.url === "/eliminar/productos"){
        
            try{
            const body = await informacion_recibida(peticion)

            if(body === null  || 
               !(Array.isArray(body.ids)) || 
               body.ids.length === 0                
            ){
                mensaje(respuesta,"datos incorrectos",400)
                return
            }
            
            const ids_unicos = new Set(body.ids)

            if(body.ids.some(function(elemento){
                    return !(Number.isFinite(elemento))  ||  
                    elemento <= 0 || 
                    !(Number.isInteger(elemento)) 
                })|| body.ids.length !== ids_unicos.size){
                mensaje(respuesta,"datos incorrectos",400)
                return
                }

            const resultado = await eliminar_producto(body.ids)

            if(validacion_supabase(resultado,respuesta,"los productos no existen")){
                return
            }

            const ids_supabase = resultado.data.map(function(elemento){
                return elemento.id
                })
                
            const busqueda_ids_incompleta = body.ids.filter(function(elemento){
                return !(ids_supabase.includes(elemento))
                })

            if(busqueda_ids_incompleta.length > 0){
                mensaje(respuesta,{problema:"Algunos IDs no se encontraron entre los productos eliminados",
                                    ids_no_encontrados: busqueda_ids_incompleta})
                return
                }
        
            mensaje(respuesta,"se eliminaron todos lo ids correctamente")
            }
            catch(error){
                manejo_errores(error, respuesta)  
            }
        
    }else if( peticion.method === "PUT" && peticion.url.startsWith("/producto/")){
        const partes_url = peticion.url.split("/")
        const id = Number(partes_url[2])
        
        if(validacion_url(partes_url,respuesta)){
            return
        }

            try{
            const body = await informacion_recibida(peticion)

            if (validacion_objeto(body) || validacion_valores_put(body)
            ) {
                mensaje(respuesta, "datos incorrectos", 400)
                return
            }

            const resultado = await actualizar_producto(id,body)

           if(validacion_supabase(resultado, respuesta)){
            return
            }

            mensaje(respuesta,"se actualizó correctamente el producto")

            }
            catch(error){
                manejo_errores(error, respuesta)
            }
    
    }else if(peticion.method === "PATCH" && peticion.url.startsWith("/producto/")){
        const partes_url = peticion.url.split("/")
        const id = Number(partes_url[2])

        if(validacion_url(partes_url,respuesta)){
            return
        }

            try{
                const body = await informacion_recibida(peticion)

                if (validacion_objeto(body) || validacion_valores_patch(body)
            ) {
                mensaje(respuesta, "datos incorrectos", 400)
                return
            }

                const resultado = await actualizar_producto(id,body)

                if(validacion_supabase(resultado,respuesta)){
                    return
                }

                mensaje(respuesta,"se actualizó correctamente el producto")
            }
            catch(error){
                 manejo_errores(error, respuesta)      
            }
    }else if(peticion.method === "POST" && peticion.url === "/imagen_url"){

    const bb = Busboy({ headers: peticion.headers })

    let imagen = []
    let tipo_imagen = ""
    let ruta = ""

    bb.on("file", function(nombre_campo, stream, informacion) {

        tipo_imagen = informacion.mimeType
        ruta = informacion.filename

        stream.on("data", function(fragmento) {
            imagen.push(fragmento)
        })

        stream.on("end", function() {
            imagen = Buffer.concat(imagen)

            console.log("Imagen recibida:", informacion.filename)
            console.log("Tamaño:", imagen.length)
        })
    })

    bb.on("close", async function() {

        const resultado = await subir_imagen(ruta, imagen, tipo_imagen)

        if(resultado.error){
            mensaje(respuesta, "Error al subir la imagen", 500)
            return
        }

        const resultado_url = cliente.storage
            .from("productos")
            .getPublicUrl(ruta)

        const imagen_url = resultado_url.data.publicUrl

        mensaje(respuesta, imagen_url)
    })

    peticion.pipe(bb)
    }
    else{
        mensaje(respuesta,"ruta no encontrada",404)
        return
    }
})

const puerto = process.env.PORT || 4000

servidor.listen(puerto, function(){
    console.log("servidor activo en el puerto " + puerto)
}) 
