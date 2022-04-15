const axios = require("axios");
const inquirer = require("inquirer");
const exec = require("child_process").exec;
const fs = require("fs");

const languages = {
  python: ".py",
  python3: ".py",
  cpp: ".cpp",
  c: ".c",
  java: ".java",
  "c#": ".cs",
  javascript: ".js",
  ruby: ".rb",
  swift: ".swift",
  go: ".go",
  kotlin: ".kt",
  scala: ".scala",
  rust: ".rs",
  php: ".php",
  typescript: ".ts",
  mysql: ".sql",
  "ms sql server": ".sql",
  oracle: ".sql",
  bash: ".sh",
};

let done = new Set();

const questions = [
  {
    type: "input",
    name: "cookie",
    message: "Enter Leetcode Cookie:",
  },
  {
    type: "input",
    name: "path",
    message: "Submissions directory:",
    default() {
      return "leetcode";
    },
  },
  {
    type: "input",
    name: "offset",
    message: "Continue from:",
    default() {
      return 0;
    },
  },
  {
    type: "input",
    name: "limit",
    message: "Limit:",
    default() {
      return 10000;
    },
  },
];

inquirer.prompt(questions).then((res) => {
  download(res.cookie, res.path, +res.offset, +res.limit);
});

async function download(cookie, path, offset, limit) {
  let has_next = true;
  const submissions = [];
  async function fetchSubmissions() {
    try {
      const res = await axios({
        url: `https://leetcode.com/api/submissions/?offset=${offset + submissions.length}&limit=${limit}`,
        headers: {
          Cookie: cookie,
        },
      });
      submissions.push(...res.data.submissions_dump);
      if (res.data.has_next && submissions.length < limit) {
        setTimeout(fetchSubmissions, 1000);
      } else {
        await saveSubmissions(submissions, path);
      }
    } catch (e) {
      console.log("WAITING FOR 25 SECONDS -", e.message);
      await saveSubmissions(submissions, path);
      setTimeout(fetchSubmissions, 25000);
    }
  }
  await fetchSubmissions();
}

async function saveSubmissions(submissions, path) {
  console.log("SAVING", submissions.length);
  await new Promise((resolve, reject) => {
    exec(`mkdir -p ${path}`, (err, stdout, stderr) => {
      if (err) reject(err);
      resolve();
    });
  });
  for (let sub of submissions) {
    if (sub.status_display == "Accepted" && !done.has(sub.title_slug)) {
      done.add(sub.title_slug);
      await new Promise((resolve, reject) => {
        fs.writeFile(
          `${path}/${sub.title_slug}${languages[sub.lang.toLowerCase()]}`,
          sub.code,
          function (err, data) {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }
  }
}
