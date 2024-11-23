(async () => {
	await dieIfNoUserAgent();

	const nationTitle: HTMLDivElement = document.querySelector('.newtitlename');
	const crossButton: HTMLInputElement = document.createElement('input');
	crossButton.setAttribute('type', 'button');
	crossButton.setAttribute('value', 'Set Cross');
	crossButton.setAttribute('class', 'button');
	nationTitle.appendChild(crossButton);

	async function getNationEndorsements(nationName: string): Promise<string[]> {
		const regex = /^.+nation=(.+)$/g;
		return Array.from(document.querySelectorAll('.unbox .nlink'))
			.map((element) => (element as HTMLAnchorElement).href)
			.map((href) => href.match(regex)[0].replace(regex, '$1'));
	}

	async function setCrossClick(e: MouseEvent): Promise<void> {
		const nationName: string = urlParameters['nation'];
		let endorsingNations: string[] = await getNationEndorsements(nationName);
		const sidePanel: HTMLDivElement = document.querySelector('#panel');
		const endorsementList: HTMLUListElement = document.createElement('ul');
		for (let i = 0; i !== endorsingNations.length; i++) {
			const listItem: HTMLLIElement = document.createElement('li');
			const endorseButton = document.createElement('input');
			endorseButton.setAttribute('type', 'button');
			endorseButton.setAttribute('class', 'ajaxbutton cross');
			endorseButton.setAttribute('value', `Endorse ${pretty(endorsingNations[i])}`);

			async function onEndorseClick(e: MouseEvent): Promise<void> {
				const result = await browser.storage.local.get('localid');
				const localId = result.localid;
				let formData = new FormData();
				formData.set('nation', endorsingNations[i]);
				formData.set('localid', localId);
				formData.set('action', 'endorse');
				await makeAjaxQuery('/cgi-bin/endorse.cgi', 'POST', formData);
				(e.target as HTMLInputElement).parentElement.removeChild(e.target as HTMLInputElement);
			}

			endorseButton.addEventListener('click', onEndorseClick);
			listItem.appendChild(endorseButton);
			endorsementList.appendChild(listItem);
		}
		sidePanel.appendChild(endorsementList);
	}

	crossButton.addEventListener('click', setCrossClick);
})();
