"use strict";

module.exports = class Estacion 
{
    constructor(id, codigo, codigoAntiguo, nombre, fechaAlta, fechaBaja, fechaCambioCodigo) 
    {
        this.id = id;
        this.codigo = codigo;
        this.codigoAntiguo = codigoAntiguo;
        this.nombre = nombre;
        this.fechaAlta = fechaAlta;
        this.fechaBaja = fechaBaja;
        this.fechaCambioCodigo = fechaCambioCodigo;
    }
    /*
    set name(name) 
    {
        this._name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    get name() 
    {
        return this._name;
    }
    sayHello() 
    {
        console.log('Hello, my name is ' + this.name + ', I have ID: ' + this.id);
    }*/
}