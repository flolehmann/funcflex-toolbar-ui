const APIS = {
    rasa: {
        url: "http://btn6xd.inf.uni-bayreuth.de/collabo-writing-rasa",
        parser_url: "http://btn6xd.inf.uni-bayreuth.de/collabo-writing-rasa/model/parse"
    },
    t5: {
        url: "http://btn6xd.inf.uni-bayreuth.de/t5/api/v1/predict"
    },
    bert2bert: {
        url: "http://btn6xd.inf.uni-bayreuth.de/bert2bert/api/v1/predict"
    },
    gptneo: {
        url: "http://btn6xd.inf.uni-bayreuth.de/gptneo/api/v1/predict"
    },
    opus_mt: {
        url: "http://btn6xd.inf.uni-bayreuth.de/opus/api/v1/predict"
    }
};

export const Intent = Object.freeze({
    "SUMMARIZE": "summarize",
    "TRANSLATE": "translate",
    "EXTEND": "extend"
});

export const parseMessage = (message, search) => {
    const value = message.toLowerCase();
    const pattern = `\\B${search}\\b`;
    const regex = new RegExp(pattern);
    const matches = value.match(regex);

    if (matches) {
        return matches;
    }
    return null;
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