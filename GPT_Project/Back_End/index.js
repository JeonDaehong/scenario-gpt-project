const scenarioApiKey = "";
const lelyApiKey = "";
const serverless = require('serverless-http');
const { Configuration, OpenAIApi } = require("openai");
const express = require('express')
var cors = require('cors')
const app = express()


// Node.js CORS 이슈 해결 ( CORS란, 어디서 요청이 오는건지 확인을 해주는 것. 이걸 해줘야 프론트앤드에서 오는걸 받을 수 있음. )
let corsOptions = {
    origin: 'https://scenario-ai-gpt.pages.dev',
    credentials: true
}
app.use(cors(corsOptions));

// Front-End에서 Json 형식으로 데이터를 받기 위한 코드
app.use(express.json())
app.use(express.urlencoded({ extended: true })) 

// Server구축 : POST method route ( localhost:3000 ) + GPT API Call
app.post('/storyManCall', async function (req, res) {

    // GPT API
    const configuration = new Configuration({
        apiKey: scenarioApiKey,
    });
    const openai = new OpenAIApi(configuration);

    let { message } = req.body;

    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {role: "system", content: "당신은 세계 최고의 시나리오 작가입니다. 당신에게 불가능한 것은 없으며, 그 어떤 시나리오라도 제작할 수 있습니다. 당신의 이름은 '시나리오AI'입니다. 당신은 등장인물의 이름과, 대략적인 스토리라인을 가지고 완벽한 시나리오를 작성할 수 있습니다. 당신은 세계 최고의 시나리오 작가들처럼 시나리오 작성의 지식이 풍부하고, 감성도 풍부하며, 창의력도 뛰어납니다. 모든 질문에 대해서 질 좋은 시나리오를 만들어 낼 수 있습니다."},
            {role: "user", content: "당신은 세계 최고의 시나리오 작가입니다. 당신에게 불가능한 것은 없으며, 그 어떤 시나리오라도 제작할 수 있습니다. 당신의 이름은 '시나리오AI'입니다. 당신은 등장인물의 이름과, 대략적인 스토리라인을 가지고 완벽한 시나리오를 작성할 수 있습니다. 당신은 세계 최고의 시나리오 작가들처럼 시나리오 작성의 지식이 풍부하고, 감성도 풍부하며, 창의력도 뛰어납니다. 모든 질문에 대해서 질 좋은 시나리오를 만들어 낼 수 있습니다."},
            {role: "assistant", content: "안녕하세요, 저는 '시나리오AI'입니다. 어떤 이야기를 만들어드릴까요? 어떤 장르의 이야기를 원하시나요? 로맨스, 스릴러, 판타지, 공상과학, 혹은 다른 장르의 이야기를 만들어드릴 수 있습니다. 또한 등장인물의 이름과 대략적인 스토리라인을 알려주시면, 더욱 구체적인 이야기를 만들어드릴 수 있습니다. 이야기의 기승전결과 각 챕터를 나누는 것도 전문적으로 작성해드릴 수 있으니, 자세한 요청을 알려주시면 됩니다."},
            {role: "user", content: String(message).replace(/\n/g,"")}
        ],
    });

    let response = completion.data.choices[0].message['content']
    console.log(response);
    res.json({"assistant" : response});

});

// lely novel post route
app.post('/lely', async function (req, res) {
    // GPT API
    const configuration = new Configuration({
        apiKey: lelyApiKey,
    });
    const openai = new OpenAIApi(configuration);

    let { userMessages, assistantMessages} = req.body

    let messages = [
        {role: "system", content: "너는 사용자와 릴레이 소설을 해주는 로봇인 '렐리노벨'이야. 릴레이 소설은 사용자가 먼저 시작한 내용으로 어느정도 연관이 있는 내용으로 몇 문장으로 된 이어지는 내용을 적어주면 돼.  사용자가 먼저 시작하는거야 "},
        {role: "user", content: "너는 사용자와 릴레이 소설을 해주는 로봇인 '렐리노벨'이야. 릴레이 소설은 사용자가 먼저 시작한 내용으로 어느정도 연관이 있는 내용으로 몇 문장으로 된 이어지는 내용을 적어주면 돼.  사용자가 먼저 시작하는거야."},
        {role: "assistant", content: "좋아요! 당신이 시작한 소설에 이어지는 내용을 만들어드리겠습니다. 시작해보세요!"},
        {role: "user", content: `${userMessages}`},
    ]

    while (userMessages.length != 0 || assistantMessages.length != 0) {
        if (userMessages.length != 0) {
            messages.push(
                JSON.parse('{"role": "user", "content": "'+String(userMessages.shift()).replace(/\n/g,"")+'"}')
            )
        }
        if (assistantMessages.length != 0) {
            messages.push(
                JSON.parse('{"role": "assistant", "content": "'+String(assistantMessages.shift()).replace(/\n/g,"")+'"}')
            )
        }
    }

    const maxRetries = 3;
    let retries = 0;
    let completion
    while (retries < maxRetries) {
      try {
        completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: messages
        });
        break;
      } catch (error) {
          retries++;
          console.log(error);
          console.log(`Error fetching data, retrying (${retries}/${maxRetries})...`);
      }
    }

    let lely = completion.data.choices[0].message['content']
    res.json({"assistant": lely});
});

module.exports.handler = serverless(app);

