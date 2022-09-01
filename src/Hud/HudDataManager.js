export async function getComponents() {
    var requestOptions = {
        method: 'GET',
        headers: {
            'x-api-key': 'D735pDPhkb4gdoFw2FpSbaqbJwEi8QHp8IuGmeFo',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
    };

    const response = await fetch("https://ogi9tmnci0.execute-api.us-east-1.amazonaws.com/default/scrimage-components-get", requestOptions)

    return await response
        .json()
        .then(response => JSON.parse(response.body))
}

export function fetchImage(imageUrl) {
    var requestOptions = {
        method: 'GET',
        headers: { "Cache-Control": 'no-cache' },
    };

    return fetch(imageUrl, requestOptions)
    .then(response => response.blob())
    .then(imageBlob => {
        return URL.createObjectURL(imageBlob);
    })
}
