export const errorHandler = (err, req, res, next) =>{
    const status = err.status || 500;
    console.error('❌', err);
    res.status(status).json({
        error: err.message|| 'Internal Server Error'
    })
}

