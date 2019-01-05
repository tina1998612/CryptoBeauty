import React, { Component } from "react";

const photographers = {
  "0": {
    name: "史旺基",
  },
}

const models = {
  "0": {
    name: "婷婷"
  },
  "1": {
    name: "思嫺"
  },
  "2": {
    name: "小敬"
  },
  "3": {
    name: "妤珊"
  },
  "4": {
    name: "帛瑜"
  },
  "5": {
    name: "佳佳"
  },
}

const photos = {
  "0": {
     "model_id": 0,
     "photographer_id": 0,
     "file_name": "0-0.jpg"
  },
  "1": {
     "model_id": 0,
     "photographer_id": 0,
     "file_name": "0-1.jpg"
  },
  "2": {
     "model_id": 0,
     "photographer_id": 0,
     "file_name": "0-2.jpg"
  },
  "3": {
     "model_id": 0,
     "photographer_id": 0,
     "file_name": "0-3.jpg"
  },
  "4": {
     "model_id": 0,
     "photographer_id": 0,
     "file_name": "0-4.jpg"
  },
  "5": {
     "model_id": 1,
     "photographer_id": 0,
     "file_name": "1-0.jpg"
  },
  "6": {
     "model_id": 1,
     "photographer_id": 0,
     "file_name": "1-1.jpg"
  },
  "7": {
     "model_id": 1,
     "photographer_id": 0,
     "file_name": "1-2.jpg"
  },
  "8": {
     "model_id": 1,
     "photographer_id": 0,
     "file_name": "1-3.jpg"
  },
  "9": {
     "model_id": 1,
     "photographer_id": 0,
     "file_name": "1-4.jpg"
  },
  "10": {
     "model_id": 2,
     "photographer_id": 0,
     "file_name": "2-0.jpg"
  },
  "11": {
     "model_id": 2,
     "photographer_id": 0,
     "file_name": "2-1.jpg"
  },
  "12": {
     "model_id": 2,
     "photographer_id": 0,
     "file_name": "2-2.jpg"
  },
  "13": {
     "model_id": 2,
     "photographer_id": 0,
     "file_name": "2-3.jpg"
  },
  "14": {
     "model_id": 2,
     "photographer_id": 0,
     "file_name": "2-4.jpg"
  },
  "15": {
     "model_id": 3,
     "photographer_id": 0,
     "file_name": "3-0.jpg"
  },
  "16": {
     "model_id": 3,
     "photographer_id": 0,
     "file_name": "3-1.jpg"
  },
  "17": {
     "model_id": 3,
     "photographer_id": 0,
     "file_name": "3-2.jpg"
  },
  "18": {
     "model_id": 3,
     "photographer_id": 0,
     "file_name": "3-3.jpg"
  },
  "19": {
     "model_id": 3,
     "photographer_id": 0,
     "file_name": "3-4.jpg"
  },
  "20": {
     "model_id": 4,
     "photographer_id": 0,
     "file_name": "4-0.jpg"
  },
  "21": {
     "model_id": 4,
     "photographer_id": 0,
     "file_name": "4-1.jpg"
  },
  "22": {
     "model_id": 4,
     "photographer_id": 0,
     "file_name": "4-2.jpg"
  },
  "23": {
     "model_id": 4,
     "photographer_id": 0,
     "file_name": "4-3.jpg"
  },
  "24": {
     "model_id": 4,
     "photographer_id": 0,
     "file_name": "4-4.jpg"
  },
  "25": {
     "model_id": 5,
     "photographer_id": 0,
     "file_name": "5-0.jpg"
  },
  "26": {
     "model_id": 5,
     "photographer_id": 0,
     "file_name": "5-1.jpg"
  },
  "27": {
     "model_id": 5,
     "photographer_id": 0,
     "file_name": "5-2.jpg"
  },
  "28": {
     "model_id": 5,
     "photographer_id": 0,
     "file_name": "5-3.jpg"
  },
  "29": {
     "model_id": 5,
     "photographer_id": 0,
     "file_name": "5-4.jpg"
  }
}

const photosFolderPath = "img/photos/";

function getRarityName(rarityScore) {
  const rarityScoreNum = parseInt(rarityScore);
  if (rarityScoreNum <= 0) {
    return "UR"
  } else if (rarityScoreNum <= 20) {
    return "SSR"
  } else if (rarityScoreNum <= 120) {
    return "SR"
  } else if (rarityScoreNum <= 370) {
    return "R"
  } else {
    return "N"
  }
}

class Card extends Component {
  render() {
    const { photoId, rarityScore } = this.props.card;
    const imgSrc = photosFolderPath + photos[photoId].file_name;
    const modelName = models[ photos[photoId].model_id ].name;
    const photographerName = photographers[ photos[photoId].photographer_id ].name;
    const rarityName = getRarityName(rarityScore);

    return (
      <article className="col-md-4 isotopeItem rare">
        <div className="portfolio-item">
          <img src={ imgSrc } alt="" />
          <div className="portfolio-desc align-center">
            <div className="folio-info">
              <h3 className="text-white white"><a># { photoId }</a></h3>
              <h3 className="text-white white"><a>{ modelName }</a></h3>
              <h5 className="text-white white"><a>By { photographerName }</a></h5>
              <h3 className="text-white white"><a>稀有度 { rarityName }</a></h3>
              <a href={imgSrc} className="fancybox"><i className="fa fa-plus fa-2x"></i></a>
            </div>
          </div>
        </div>
      </article>
    );
  }
};

class Cards extends Component {
  render() {
    const { cards } = this.props;

    const cardDivs = cards.map((card) => {
      return <Card card={card} />
    });
    return (
      <div className="col-md-12">
        <div className="row">
          <div className="portfolio-items isotopeWrapper clearfix" id="3">
            { cardDivs }
          </div>
        </div>
      </div>
    );
  }
};

export default Cards;
