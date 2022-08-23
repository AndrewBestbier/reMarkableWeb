<!-- markdownlint-configure-file {
  "MD013": {
    "code_blocks": false,
    "tables": false
  },
  "MD033": false,
  "MD041": false
} -->

<div align="center">

# ReMarkable Web


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)
[![Buymeacoffee](https://badgen.net/badge/icon/buymeacoffee?icon=buymeacoffee&label)](https://www.buymeacoffee.com/andrewbest)


**ReMarkable Web** is a web application deployed [here](https://remarkable-web.vercel.app/) that imports highlights from [ReMarkable](https://remarkable.com/) devices and exports them to providers such as [Readwise](https://readwise.io/).

[Features](#features) •
[Getting Started](#getting-started) •
[Contributing](#contributing) •
[Technologies used](#technologies-used)

</div>


<img width="1058" alt="Screenshot" src="https://user-images.githubusercontent.com/102973673/186132993-7e66349c-7b71-47db-ba87-85d0baf6c056.png">

## Features

- View highlights
- Export to CSV, Markdown and Readwise

## Getting Started

First install the npm dependencies:

```
npm install
```

Next run the Next application:

```
npm run dev
```

If you wish to run it with vercel so that the manual python function will work:

```
vercel dev
```

The application should then be running at http://localhost:3000/

## Contributing

Contributions are very welcome! Please fork and PRs to build this into a fantastic community tool. On the road-map of ideas are:

- Move, Rename and Delete files
- Neaten up code, remove 'any' uses
- Sort by values other than alphabetical 
- Filter by favourites, ebooks, pdfs
- Export to Zotero, Obsidian

## Technologies used

- [Next](https://nextjs.org/)
- [Tailwind](https://tailwindcss.com/)
- [Ant design](https://ant.design/)

