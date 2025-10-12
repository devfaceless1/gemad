createCase({
  id: "case1",
  cost: 150,
  prizes: [
    { label: 'Heart 15 ⭐', color: '#000', img: 'gif/heart15.gif', weight: 44 },
    { label: 'Trophy 100 ⭐', color: '#000', img: 'gif/trophy100.gif', weight: 1 },
    { label: 'Diamond Ring 100 ⭐', color: '#000', img: 'gif/ring100.gif', weight: 1 },
    { label: 'Cake 50 ⭐', color: '#000', img: 'gif/cake50.gif', weight: 10 },
    { label: 'Teddy 15 ⭐', color: '#000', img: 'gif/bear15.gif', weight: 44 },
  ],
  buttonId: 'spin',
  resultId: 'result',
  stripId: 'strip',
  viewportId: 'viewport'
});

createCase({
  id: "case2",
  cost: 1000,
  prizes: [
    { label: 'NFT Monkey 1000 ⭐', color: '#000', img: 'gif/nft-monkey.gif', weight: 0.03 },
    { label: 'Teddy 15 ⭐', color: '#000', img: 'gif/bear15.gif', weight: 50 },
    { label: 'Flowers 50 ⭐', color: '#000', img: 'gif/flowers.gif', weight: 5 },
    { label: 'Rose 25 ⭐', color: '#000', img: 'gif/rose.gif', weight: 30 },
    { label: 'Rocket 50 ⭐', color: '#000', img: 'gif/rocket.gif', weight: 5 },
  ],
  buttonId: 'spin2',
  resultId: 'result2',
  stripId: 'strip2',
  viewportId: 'viewport2'
});