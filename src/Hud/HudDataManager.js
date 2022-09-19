export async function getComponents() {
    // const uri = "https://tuiciahimg.execute-api.us-east-1.amazonaws.com/default/components-get"
    const uri = "https://b4d9c732-e216-490b-baef-276ff515e212.mock.pstmn.io/default/components-get" // mock
    const apiKey = "jZhWxe0rSs4qG28BR1I3zxceujW5MUEaS3FU65Qj"

    var requestOptions = {
        method: 'GET',
        headers: {
            'x-api-key': apiKey,
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
    };

    const response = await fetch(uri, requestOptions)

    return response.json().then(response => {
        return response.results
    })
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
