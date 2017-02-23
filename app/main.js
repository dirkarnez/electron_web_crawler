import url from 'url';

import React from 'react';
import ReactDOM from 'react-dom';
import WordFrequencyCrawler from './services/wordFrequencyCrawler';
import throttle from 'throttle-debounce/throttle';
import debounce from 'throttle-debounce/debounce';
import shell from 'shell';
import {action, autorun, observable, computed, observe} from "mobx";
import {observer} from "mobx-react";
import $ from 'jquery';
import electronOpenLinkInBrowser from "electron-open-link-in-browser";
import natural from 'natural'


class AppState {
  crawler;
  @observable _version = 0;
  @observable wordsList = [];
  @observable processedUris = [];
  @observable succesfulyProcessedUrisNumber = 0;
  @observable fetchErrorsNumber = 0;
  @observable crawlerRunning = 0;
  @observable fetchCompleted = false;
  @observable searchedWord ='';

  @computed get currentWordInfo(){
    this._version;
    return  this.crawler ? this.crawler.getResourceInfo(this.searchedWord) : {}
  }

  @action startCrawler(crawlerConfig) {
      const that = this;
      that.crawlerRunning = 1;
      that.crawler = WordFrequencyCrawler(crawlerConfig);
      const urlObjectFeorCrawler = url.parse(crawlerConfig.url);

      that.crawler.events
      .on('pageCompleted', throttle(2000, () => {
          
          that.wordsList = that.crawler.getOrderedWordsList().slice(0, 100)

          that.succesfulyProcessedUrisNumber = that.crawler.getSuccesfulyProcessedUrisNumber();
          that._version =  that._version + 1;
           
      })).on( ('fetchError'),  throttle(2000, () => {
      
        that.fetchErrorsNumber = that.crawler.getFetchErrorsNumber();
      
      })).on('websiteCompleted', () => {
        
        window.alert('completed')
        that.fetchCompleted = true;
      
      })
      that.crawler.start();
  }
}

const store = new AppState();
//for debugging
window.store = store;

@observer
class CrawlerConfig extends React.Component {
  handleSubmit(event){
  	event.preventDefault();
    const formObject = {};
    $(event.currentTarget).serializeArray().forEach(el =>  formObject[el.name] = el.value )
    
    this.props.store.startCrawler( formObject );
  }

    handleCheckBox(){
      
    }

  render() {
    const { crawlerRunning } = this.props.store;
    return  (
    	<div>
        <form onSubmit={this.handleSubmit.bind(this)} >
        	<fieldset  disabled={crawlerRunning}>
        		<h3 style={{textAlign: 'center' }}>Crawler configuration</h3>
              <div className="input-group">
                  Enter a website url to get keywords statistics
                  <input name='url' className="form-control" type="text" defaultValue='https://techcrunch.com/' placeholder="website"/>
              </div>
              <div className="input-group">
                  Search for a specific keywords
                  <input className="form-control" type="text" placeholder="default search for all" disabled/>
              </div>
               <div className="input-group" >
                  Search by a regular expression
                  <input className="form-control" type="text" disabled />
              </div>

              <div className="col-xs-4" style={{marginBottom: "10px"}}>
                  Provide n for n-gram :)
                  <input name="ngramSize" className="form-control" type="number" min="1" defaultValue='1'/>
              </div>
              <div className="row"></div>
              <div className="col-xs-4">
                  Skip words with length less than 
				          <input name="minWordLength" className="form-control" type="number" min="1" defaultValue='4'/>
              </div>
              <div className="col-xs-4">
                  Word length less than
                  <input className="form-control" type="number" min="2" defaultValue='' disabled/>
              </div>
              <div className="row"></div>
              <div className="input-group">
                  <div className="col-xs-4">
                      Max depth
                  </div>
                  <div className="col-xs-4">
                      Max concurrency
                  </div>
                  <div className="col-xs-4">
                      Interval
                  </div>
                  <div className="row"></div>
                  <div className="col-xs-4">
                      <input name="maxDepth" className="form-control" type="number" min="1" defaultValue='1' defaultValue='2'/>
                  </div>
                  <div className="col-xs-4">
                      <input name="maxConcurrency"  className="form-control" type="number" min="1" defaultValue='3' />
                  </div>
                  <div className="col-xs-4">
                      <input name="interval_ms" className="form-control" type="number" min="1" defaultValue='100'/>
                  </div>
              </div>
              <button type="send" className="btn btn-defautl" style={{marginTop: '10px'}}> start crawling</button> 

            </fieldset>    
        </form>
    </div>);
  }
}

@observer
class WordInfo extends React.Component {

  handleChange(event){
    this.props.store.searchedWord = event.currentTarget.value;
  }

	render() {
    const {  currentWordInfo}  = this.props.store;
		return  (
			<div >
			   <div style={{textAlign: 'center'}}>
	        	Search a specific word <input name="wordSearch" type="text"  onChange={this.handleChange.bind(this)}/>
	    	    </div>
        <div> 
        <h5> word <strong>"{this.props.store.searchedWord}"</strong> found on next pages </h5>
        </div>
        <div> Number of urls <strong> { ( currentWordInfo.uris || [] ).length } </strong> </div>
	    		{
    			( currentWordInfo.uris || [] ).map( (el, index) => (
    				<div data-id="wordInfo" key={el[0]} className="word_info_item">
    					<div>
    						{ store.crawler.urlObject.protocol + '//' + store.crawler.urlObject.hostname + el[0] }
              </div>
    					<div>
    						<span> word </span>
    						<strong>{el.word ? el.word.join(',') : '' }</strong>
    					</div>
    					<div>
    						<span>times </span>
    						<strong>{ el[1].count }</strong>
    					</div>
               <div style={{ display: 'block' }} >
                <div>
                  Positions within the page
                  <div>
                   
                    { el[1].positions.map(pos => <span key={pos}><span>{pos}</span><span>,</span></span> ) }
                  </div>
                </div>
              </div>
    				</div>
	    				))
	    		}
			</div>
		);
	}
}

@observer
class WordsList extends React.Component {
  // words list
  handleWordsListClick(event){ this.props.store.searchedWord = event.currentTarget.dataset.word; }

  render() {
    const {wordsList}  = this.props.store;
    if( wordsList.length ){}
    return  (
    	<div>
	    	<div style={{textAlign: 'center'}}>
	        	Top 100 Words    
	    	</div>
	    	<div  style={{overflow:'hidden'}}>
	    		{
	    			wordsList.map( (el, index) => (
    				<div data-id="wordElement" onClick={this.handleWordsListClick.bind(this)} data-word={el.word} data-index={index} key={el.word} className="word_list_item">
    					<div>
    						<span style={{marginRight: '5px'}}>index</span>
    						<span>{index}</span>
    					</div>
    					<div>
    						<span style={{marginRight: '5px'}}>word</span>
    						<strong>{el.word ? el.word.join(',') : '' }</strong>  						
    					</div>
    					<div>
    						<span style={{marginRight: '5px'}}>founds</span>
    						<strong>{el.allCount}</strong>
    					</div>
    				</div>
    				))
	    		}
	    	</div>
    	</div>
    );
  }
}


@observer
class RequestsStatistics extends React.Component {
  render() {
    const {succesfulyProcessedUrisNumber, fetchErrorsNumber}  = this.props.store;
    return  (
      <div>
    	   <div className="row" style={{textAlign: 'left'}}>
          	 Requests
             <div>
                Successfully processed urls : { succesfulyProcessedUrisNumber }
             </div>
             <div>
                Fetch errors occured (only 40x or 50x statuses ) : { fetchErrorsNumber }
             </div>
    	   </div>
      </div>
    )
  }
}

@observer
class Main extends React.Component {
  render() {
    return  (
    	<div>
          <div className="row">
    	       <div className="col-xs-6" >
    	            <CrawlerConfig store={store}/>
    	    	  </div>
              <div  className="col-xs-6">
                 <RequestsStatistics store={store}/>     
              </div>
          </div>
	    	  <div className="row clearfix " style={{height: '30px', width: '100%'}}></div>  
	    	  <div className="row">
  	    		<div className="col-xs-4"><WordsList store={store}/></div>
  	    		<div className="col-xs-8"><WordInfo store={store}/></div>
	    	</div>
    	</div>
    )
  }
}

window.onload = () => ReactDOM.render(<Main />, document.getElementById('app'));