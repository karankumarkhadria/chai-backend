class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        error = [],
        statck = ""
    ){
       super(message)
       this.statusCode = statusCode
       this.data = null
       this.message = message
       this.success = false
       this.errors = errors

       if(statck){
        this.stack = statck
       }
       else{
        Error.captureStackTrace(this,this.constructor)
       }
    }
}

export {ApiError}

//hamne yhan par sahuliyat bana li h ki agar api erros aayegi to aise hi aayegi

//find out this.data me hota kya hai