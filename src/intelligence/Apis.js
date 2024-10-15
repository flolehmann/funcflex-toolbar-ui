const APIS = {
    rasa: {
        url: "YOUR_RASA_URL",
        parser_url: "YOUR_RASA_URL/model/parse"
    },
    t5: {
        url: "YOUR_T5_URL"
    },
    gptneo: {
        url: "YOUR_GPTNEO_URL"
    },
    opus_mt: {
        url: "YOUR_OPUSMT_URL"
    },
    gpt_3: {
        url: "https://api.openai.com/v1/completions",
        model: "gpt-3.5-turbo-instruct",
        key: process.env.REACT_APP_OPENAI_KEY
    }
};

export const detectIntent = (message) => {
    return fetch(APIS.rasa.parser_url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "text": message,
            "message_id": "b2831e73-1407-4ba0-a861-0f30a42a2a5a"
        })
    })
        .then(response => response.json())
        .then(result => {
            return result;
        });
}

export const summarize = (text) => {
    return fetch(APIS.t5.url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "input": text,
            "funcion": "summarization"
        })
    })
        .then(response => response.json())
        .then(result => {
            return result;
        });
}

export const translateDeEn = (text) => {
    return fetch(APIS.opus_mt.url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "input": text,
            "function": "translation_de_en"
        })
    })
        .then(response => response.json())
        .then(result => {
            return result;
        });
}

export const translateFrEn = (text) => {
    return fetch(APIS.opus_mt.url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "input": text,
            "function": "translation_fr_en"
        })
    })
        .then(response => response.json())
        .then(result => {
            return result;
        });
}

export const generate = (text) => {
    return fetch(APIS.gptneo.url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "input": text
        })
    })
        .then(response => response.json())
        .then(result => {
            return result;
        });
}

export const prompt = (text) => {
    return fetch(APIS.gpt_3.url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + APIS.gpt_3.key
        },
        body: JSON.stringify({
            "model": APIS.gpt_3.model,
            "prompt": text,
            "max_tokens": 256,
            "temperature": 0.5,
            "top_p": 1,
            "n": 1,
            "stream": false,
            "logprobs": null,
            "stop": null
        })
    })
    .then(response => response.json())
    .then(result => {
        return result;
    });
}