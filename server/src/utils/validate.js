export function assert(cond, msg) {
    if(!cond) {
        const e = new Error(msg || 'Bad Request')
        e.status = 400
        throw e
    }
}