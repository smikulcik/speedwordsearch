const generator = require('@sbj42/word-search-generator')

function generateWordsearch () {
  if (process.env.DEMO === 'true') { // use a pre-generated one so that tests don't have to deal with randomness
    return demoWordsearch
  }

  const puzzle = generator.generate({})

  const board = []
  for (let i = 0; i < puzzle.grid.length / puzzle.width; i++) {
    board.push([])
  }
  let x, y
  for (let i = 0; i < puzzle.grid.length; i++) {
    x = Math.floor(i / puzzle.width)
    y = Math.floor(i % puzzle.width)
    board[x][y] = puzzle.grid[i]
  }
  return {
    board: board,
    words: puzzle.words
  }
}

module.exports = {
  generateWordsearch
}

const demoWordsearch = {
  board: [
    [
      'R',
      'D',
      'H',
      'O',
      'F',
      'F',
      'F',
      'U',
      'T',
      'S'
    ],
    [
      'E',
      'A',
      'I',
      'O',
      'G',
      'A',
      'S',
      'L',
      'S',
      'D'
    ],
    [
      'V',
      'D',
      'L',
      'L',
      'T',
      'C',
      'S',
      'I',
      'Y',
      'E'
    ],
    [
      'A',
      'A',
      'W',
      'L',
      'A',
      'E',
      'M',
      'T',
      'S',
      'R'
    ],
    [
      'C',
      'O',
      'N',
      'R',
      'O',
      'R',
      'L',
      'O',
      'E',
      'Y'
    ],
    [
      'N',
      'R',
      'R',
      'D',
      'A',
      'D',
      'O',
      'D',
      'S',
      'R'
    ],
    [
      'K',
      'Y',
      'U',
      'E',
      'E',
      'L',
      'N',
      'O',
      'I',
      'T'
    ],
    [
      'R',
      'O',
      'T',
      'E',
      'T',
      'E',
      'U',
      'P',
      'E',
      'T'
    ],
    [
      'O',
      'N',
      'E',
      'S',
      'T',
      'L',
      'E',
      'D',
      'R',
      'Y'
    ],
    [
      'C',
      'G',
      'I',
      'R',
      'L',
      'T',
      'I',
      'T',
      'L',
      'E'
    ]
  ],
  words: [
    'arm',
    'carry',
    'cave',
    'cork',
    'dollar',
    'dry',
    'fast',
    'fat',
    'fly',
    'gas',
    'girl',
    'hotel',
    'lid',
    'loose',
    'miss',
    'nest',
    'now',
    'off',
    'pet',
    'red',
    'ripe',
    'road',
    'rot',
    'seed',
    'soul',
    'stuff',
    'tea',
    'tender',
    'title',
    'try',
    'turn',
    'use'
  ]
}
