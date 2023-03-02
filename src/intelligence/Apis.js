const APIS = {
    rasa: {
        url: "https://btn6xd.inf.uni-bayreuth.de/collabo-writing-rasa",
        parser_url: "https://btn6xd.inf.uni-bayreuth.de/collabo-writing-rasa/model/parse"
    },
    t5: {
        url: "https://btn6xd.inf.uni-bayreuth.de/t5/api/v1/predict"
    },
    bert2bert: {
        url: "https://btn6xd.inf.uni-bayreuth.de/bert2bert/api/v1/predict"
    },
    gptneo: {
        url: "https://btn6xd.inf.uni-bayreuth.de/gptneo/api/v1/predict"
    },
    opus_mt: {
        url: "https://btn6xd.inf.uni-bayreuth.de/opus/api/v1/predict"
    },
    gpt_3: {
        url: "https://api.openai.com/v1/completions",
        model: "text-davinci-003",
        key: process.env.REACT_APP_OPENAI_KEY
        //key: "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"
        //key: "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"
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