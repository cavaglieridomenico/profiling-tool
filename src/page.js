async function getTargetPage(browserInstance, url) {
  let pageForTracing;
  const pages = await browserInstance.pages();
  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(
        'Invalid URL. Please provide a full URL starting with http:// or https://'
      );
      process.exit(1);
    }
    console.log(`Navigating to ${url}...`);
    pageForTracing = await browserInstance.newPage();
    await pageForTracing.setCacheEnabled(false);
    await pageForTracing.goto(url);
    console.log('Navigation complete.');
  } else if (pages.length > 0) {
    pageForTracing = pages[0];
    await pageForTracing.setCacheEnabled(false);
    console.log(
      `Using first open page for tracing: ${await pageForTracing.url()}`
    );
  } else {
    console.log('No open pages. A new page will be created for tracing.');
    pageForTracing = await browserInstance.newPage();
    await pageForTracing.setCacheEnabled(false);
  }
  return pageForTracing;
}

module.exports = { getTargetPage };
