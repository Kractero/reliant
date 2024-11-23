(() => {
	async function getNumSwitchers(): Promise<number> {
		const result = await browser.storage.local.get('switchers');
		return result.switchers?.length || 0;
	}

	async function getCurrentWa(): Promise<string> {
		const result = await browser.storage.local.get('currentwa');
		return result.currentwa || 'N/A';
	}

	async function init(): Promise<void> {
		const values = await Promise.all([getNumSwitchers(), getCurrentWa()]);
		document.querySelector('#switchers-left').innerHTML = String(values[0]);
		document.querySelector('#current-wa-nation').innerHTML = values[1];
	}

	init();
})();
