(() => {
	async function addSwitcher(newSwitcher: Switcher): Promise<void> {
		const result = await browser.storage.local.get('switchers');
		let switchers: Switcher[] = result.switchers || [];

		if (!switchers.some((switcher) => switcher.name === newSwitcher.name)) {
			switchers.push(newSwitcher);
			await browser.storage.local.set({ switchers: switchers });
		}
	}

	if (urlParameters['page'] === 'join_WA') {
		const switcherRegex: RegExp = new RegExp(`nation=([A-Za-z0-9_-]+?)&appid=([0-9]+)`, 'g');
		const match = switcherRegex.exec(document.URL);
		const newSwitcher: Switcher = {
			name: match[1],
			appid: match[2]
		};
		addSwitcher(newSwitcher);
	}
})();
