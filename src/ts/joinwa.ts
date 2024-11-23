(() => {
	async function addSwitcher(newSwitcher: Switcher): Promise<void> {
		const result = await browser.storage.local.get('switchers');
		let switchers: Switcher[] = result.switchers || [];

		if (!switchers.some((switcher) => switcher.name === newSwitcher.name)) {
			switchers.push(newSwitcher);
			await browser.storage.local.set({ switchers: switchers });
		}
	}

	window.addEventListener('hashchange', () => {
		let a: NodeList = document.querySelectorAll('a');
		for (let i = 0; i !== a.length; i++) {
			let link: string = (a[i] as HTMLAnchorElement).href;
			if (link.indexOf('join_WA') !== -1) {
				const switcherRegex: RegExp = new RegExp(`nation=([A-Za-z0-9_-]+?)&appid=([0-9]+)`, 'g');
				console.log(link);
				const match: string[] = switcherRegex.exec(link);
				const newSwitcher: Switcher = {
					name: match[1],
					appid: match[2]
				};
				addSwitcher(newSwitcher);
			}
		}
	});
})();
