import url from 'url';
import EventsEmmiter from 'events'

import SimpleCrawler from "simplecrawler";
import cheerio from 'cheerio';
import contentType from 'content-type';
import htmlToText from 'html-to-text';
import XRegExp from 'XRegExp';
import kMeans from 'k-means';
import natural from 'natural';
import { arrayToNgramArray } from './helpers';

const NGrams = natural.NGrams;

module.exports = function(params) {
    if (!params.url || !params.interval_ms || !params.maxConcurrency || !params.maxDepth) {
        throw new Error("wordFrequencyCrawler missing require parameter");
    }
    const events = new EventsEmmiter();

    let setOfDiscoveredUriPaths = new Set();
    let setOfProcessedUriPaths = new Set();
    let setOfFailedUrisPaths = new Set();

    let fetchErrorsCounter = 0;
    //hack just for performance purposes
    const wordsMap = {};
    const wordsOrderedList = [];

    const crawler = SimpleCrawler(params.url);
    const initialURLobject = url.parse(params.url);

    crawler.interval = params.interval_ms;
    crawler.maxConcurrency = params.maxConcurrency
    crawler.maxDepth = params.maxDepth;
    crawler.allowInitialDomainChange = true;
    crawler.defaultDiscovetResourcesFunction = crawler.discoverResources.bind(crawler);

    crawler.discoverResources = function(resourceText, queueItem) {
        const currentUriPath = url.parse(queueItem.url).path || '/';
        let discoveredURIs =
            crawler.defaultDiscovetResourcesFunction(resourceText)
            .filter(el => el.includes('href'))
            .map(
                el => url.parse(
                    cheerio.load(`<a ${el.trim()}></a>`)('a').attr('href')
                )
            )
            .filter(el => (!el.hostname || el.hostname == initialURLobject.hostname) &&
                (!el.path || !el.path.endsWith('.png') && !el.path.endsWith('.jpeg') && !el.path.endsWith('.jpg'))
            )
            .map(
                el => el.path && el.path.charAt(0) !== '/' ?
                '/' + el.path :
                (el.path || '/')
            );
        //update new set of all discovered URIs
        const setOfNewDiscoveredUris = new Set(discoveredURIs).difference(setOfDiscoveredUriPaths);
        setOfDiscoveredUriPaths = setOfDiscoveredUriPaths.union(discoveredURIs);
        return Array.from(setOfNewDiscoveredUris).map(el => `href="${el}"`);
    };

    crawler.on('queueadd', (queueItem) => {

    }).on('queueerror', (error, URLData) => {

    }).on('fetcherror', (error, URLData) => {

        fetchErrorsCounter = fetchErrorsCounter + 1;
        () => events.emit('fetchError')

    }).on("fetchcomplete", (queueItem, responseBuffer, response) => {

        const contentTypeObj = contentType.parse(response.headers['content-type']);
        if (setOfProcessedUriPaths.has(queueItem.path) ||
            response.statusCode !== 200 ||
            contentTypeObj.type !== 'text/html') return;
        setOfProcessedUriPaths.add(queueItem.path);

        const htmlString = responseBuffer.toString(contentTypeObj.parameters.charset);
        const $ = cheerio.load(htmlString)
        const webSiteText = htmlToText.fromString($('body').html(), {
            ignoreHref: true,
            ignoreImage: true,
            preserveNewlines: true
        });

        const tokenizer = new natural.WordTokenizer();

        NGrams.ngrams( tokenizer.tokenize(webSiteText)
                .map(word => word.toLowerCase())
                .filter(word => word.length >= params.minWordLength), Number(params.ngramSize)
            )
            .forEach((entity, index) => toStore(queueItem, entity, index));

        events.emit('pageCompleted');

    }).on('complete', () => events.emit('websiteCompleted'));

    function toStore(queueItem, entity, index, ) {
        //magic heapens here
        //better rebuild it and use imutable magic
        if (!wordsMap[entity]) {
            wordsMap[entity] = {};
            wordsOrderedList.push(wordsMap[entity]);
        };

        const uris = ((wordsMap[entity] || {}).uris || {});
        uris[queueItem.path] = {
            uri: queueItem.path,
            count: ((uris[queueItem.path] || {}).count || 0) + 1,
            word: entity,
            positions: ((uris[queueItem.path] || {}).positions || []).concat(index)
        };
        wordsMap[entity].uris = uris;
        wordsMap[entity].word = wordsMap[entity].word || entity;
        wordsMap[entity].allCount = ((wordsMap[entity] || {}).allCount || 0) + 1;
    }

    return {
        start: () => {
            events.emit('crawlerStarted');
            crawler.start();
        },
        //not good interface but it is faster
        getOrderedWordsList: () => wordsOrderedList.sort((a, b) => b.allCount - a.allCount).slice(), //mutates array and uses quick search
        getResourceInfo: (word) => wordsMap[word] ? {
            allCount: wordsMap[word].allCount,
            uris: Object.entries(wordsMap[word].uris)
        } : {},
        getProcessedUris: () => new Set(...setOfProcessedUriPaths),
        getSuccesfulyProcessedUrisNumber: () => setOfProcessedUriPaths.size,
        getFetchErrorsNumber: () => fetchErrorsCounter,
        urlObject: url.parse(params.url),
        engine: crawler,
        events: events
    };
}
