(async () => {
	/* Every button with class "ajaxbutton" indicates that the button makes a request to
	 * the NS server. The "makeAjaxQuery" function will disable these buttons when a request
	 * starts and will only be re-enabled once a complete response has been received from the
	 * NS server in order to comply with rule "4. Avoid Simultaneous Requests".
	 */
	const pageContent: string = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Reliant</title>
        <meta charset="utf-8">
    </head>
    <body>
        <div id="container">
            <div id="group-2">
                <!-- Switchers -->
                <div id="switchers-container">
                    <span class="header">Switchers Left</span>
                    <span class="information" id="num-switchers">0</span>
                </div>
                <div id="load-time-container">
                    <span class="subheader">Load Time</span>
                    <span class="information" id="load-time"></span>
                </div>
                <!-- Current WA Nation -->
                <div id="current-wa-nation-container">
                    <div class="buttonblock">
                        <input type="button" class="ajaxbutton" id="update-localid" value="Update Localid">
                        <input type="button" class="ajaxbutton" id="update-wa-status" value="Update">
                    </div>
                    <span id="current-wa-nation-header" class="header">Current WA Nation</span>
                    <div class="buttonblock">
                        <input type="button" id="resign" value="Resign" class="ajaxbutton">
                        <input type="button" id="admit" value="Admit on Next Switcher" class="ajaxbutton">
                    </div>
                    <span id="current-wa-nation" class="information">N/A</span>
                </div>
                <!-- Status -->
                <div id="status-container">
                    <span id="status-header" class="header">Status</span>
                    <span id="status" class="information">N/A</span>
                </div>
                <!-- Current Region -->
                <div id="current-region-container">
                    <span id="current-region-header" class="header">Current Region</span>
                    <span id="current-region" class="information">N/A</span>
                    <span class="subheader">WA Delegate</span>
                    <span class="information" id="wa-delegate">N/A</span>
                    <span class="subheader">Last WA Update</span>
                    <span class="information" id="last-wa-update">N/A</span>
                    <input type="button" class="ajaxbutton" id="update-region-status" value="Update">
                    <input type="button" class="ajaxbutton" id="check-current-region" value="Check Current Region">
                    <input type="hidden" id="delegate-nation" value="N/A">
                    <input type="button" class="ajaxbutton" id="endorse-delegate" value="Endorse Delegate">
                    <input type="button" id="copy-win" value="Copy Win">
                    <input type="button" id="copy-orders" value="Copy Orders">
                    <input type="button" id="open-region" value="Open">
                </div>
                <!-- Current Region Happenings -->
                <div id="current-region-happenings-container">
                    <span class="header">Region Happenings</span>
                    <ul class="information" id="region-happenings">
                    </ul>
                </div>
            </div>
            <div id="group-5">
                <!-- Chasing -->
                <div id="chasing-container">
                    <span id="chasing-header" class="header">Chasing</span>
                    <span class="subheader">JP</span>
                    <input type="button" id="move-to-jp" value="Move to JP" class="ajaxbutton">
                    <span class="subheader">Chase</span>
                    <input type="button" id="chasing-button" value="Refresh" class="ajaxbutton">
                </div>
                <!-- Reports Container -->
                <div id="reports-container">
                    <span class="header">Reports</span> (<span id="reports-time"></span>)
                    <ul id="reports" class="information">
                    </ul>
                </div>
            </div>
            <div id="group-3">
                <!-- Endorsing -->
                <div id="endorse-container">
                    <span id="endorse-header" class="header">Endorse</span>
                    <div class="buttonblock">
                        <input type="button" id="refresh-endorse" value="Refresh" class="ajaxbutton">
                    </div>
                    <ul class="information" id="nations-to-endorse">
                    </ul>
                </div>
                <!-- Dossier -->
                <div id="dossier-container">
                    <span id="dossier-header" class="header">Dossier</span>
                    <div class="buttonblock">
                        <input type="button" id="refresh-dossier" value="Refresh" class="ajaxbutton">
                        <label for="raider-jp">Raider Jump Point</label>
                        <input type="text" id="raider-jp">
                        <input type="button" id="set-raider-jp" value="Set">
                    </div>
                    <ul class="information" id="nations-to-dossier">
                    </ul>
                </div>
            </div>
            <div id="group-4">
                <!-- JP Happenings -->
                <div id="jp-happenings-container">
                    <span class="header">JP Happenings</span>
                    <ul class="information" id="jp-happenings">
                    </ul>
                </div>
                <!-- Raider Happenings -->
                <div id="raider-happenings-container">
                    <span class="header">Raider Happenings</span>
                    <ul class="information" id="raider-happenings">
                    </ul>
                </div>
            </div>
            <div id="group-6">
                <!-- Did I Update? -->
                <div id="did-i-update-container">
                    <span class="header">Did I Update?</span>
                    <input type="button" class="ajaxbutton" id="check-if-updated" value="Did I Update?">
                    <div class="information">
                        <ul id="did-i-update">
                        </ul>
                    </div>
                </div>
                <!-- World Happenings-->
                <div id="world-happenings-container">
                    <span class="header" id="world-happenings-header">World Happenings</span>
                    <input type="button" class="ajaxbutton" id="update-world-happenings" value="Update">
                    <ul class="information" id="world-happenings">
                    </ul>
                </div>
            </div>
        </div>
    </body>
</html>
`;

	document.body.innerHTML = '';
	document.body.insertAdjacentHTML('afterbegin', pageContent);

	await dieIfNoUserAgent();

	let notyf = new Notyf({
		duration: 3000,
		position: {
			x: 'right',
			y: 'top'
		}
	});

	/*
	 * Dynamic Information
	 */

	const status: HTMLSpanElement = document.querySelector('#status');
	const currentWANation: HTMLSpanElement = document.querySelector('#current-wa-nation');
	const nationsToEndorse: HTMLUListElement = document.querySelector('#nations-to-endorse');
	const nationsToDossier: HTMLUListElement = document.querySelector('#nations-to-dossier');
	const currentRegion: HTMLSpanElement = document.querySelector('#current-region');
	const didIUpdate: HTMLUListElement = document.querySelector('#did-i-update');
	const reports: HTMLUListElement = document.querySelector('#reports');
	const regionHappenings: HTMLUListElement = document.querySelector('#region-happenings');
	const worldHappenings: HTMLUListElement = document.querySelector('#world-happenings');
	const reportsTime: HTMLSpanElement = document.querySelector('#reports-time');

	/*
	 * Things to keep track of
	 */

	let nationsDossiered: string[] = [];
	let nationsEndorsed: string[] = [];
	let moveCounts: object = {};

	/*
	 * Helpers
	 */

	async function manualLocalIdUpdate(e: MouseEvent): Promise<void> {
		freshlyAdmitted = false;
		console.log('manually updating localid');
		let response = await makeAjaxQuery('/region=rwby', 'GET');
		getLocalId(response);
		status.innerHTML = 'Updated localid.';
		// reset buttons
		(document.querySelector('#move-to-jp') as HTMLInputElement).value = 'Move to JP';
		(document.querySelector('#chasing-button') as HTMLInputElement).value = 'Refresh';
	}

	async function manualChkUpdate(e: MouseEvent): Promise<void> {
		let response = await makeAjaxQuery('/page=un', 'GET');
		getChk(response);
		// while we're getting the chk, we may as well check the current nation too
		let nationNameRegex = new RegExp('data-nname="([A-Za-z0-9_-]+?)">');
		await setStorageValue('currentwa', nationNameRegex.exec(response)[1]);
	}

	/*
	 * Event Handlers
	 */

	async function resignWA(e: MouseEvent): Promise<void> {
		const result = await browser.storage.local.get('chk');
		const currentWa = await getStorageValue('currentwa');
		const chk = result.chk;
		let formData = new FormData();
		formData.set('action', 'leave_UN');
		formData.set('chk', chk);

		const response = await makeAjaxQuery('/page=UN_status', 'POST', formData);

		if (response.indexOf('You inform the World Assembly that') !== -1) {
			freshlyAdmitted = false;
			status.innerHTML = `Resigned from the WA on ${currentWa}.`;
			await setStorageValue('currentwa', '');
		}
	}

	async function admitWA(e: MouseEvent): Promise<void> {
		const result = await browser.storage.local.get('switchers');

		(document.querySelector('#chasing-button') as HTMLInputElement).value = 'Refresh';
		(document.querySelector('#move-to-jp') as HTMLInputElement).value = 'Move to JP';
		currentRegion.innerHTML = 'N/A';
		document.querySelector('#wa-delegate').innerHTML = 'N/A';
		document.querySelector('#last-wa-update').innerHTML = 'N/A';
		nationsToEndorse.innerHTML = '';
		nationsToDossier.innerHTML = '';
		nationsDossiered = [];
		nationsEndorsed = [];

		let storedSwitchers: Switcher[] = result.switchers;
		if (typeof storedSwitchers === 'undefined') {
			status.innerHTML = 'No switchers stored.';
			return;
		}
		let formData = new FormData();
		formData.set('nation', storedSwitchers[0].name);
		formData.set('appid', storedSwitchers[0].appid);
		let response = await makeAjaxQuery('/cgi-bin/join_un.cgi', 'POST', formData, true);
		if (response.indexOf('Welcome to the World Assembly, new member') !== -1) {
			freshlyAdmitted = true;
			status.innerHTML = `Admitted to the WA on ${storedSwitchers[0].name}.`;
			await browser.storage.local.set({ currentwa: storedSwitchers[0].name });
			getChk(response);
			storedSwitchers.shift();
		} else if (response.indexOf('Another WA member nation is currently using the same email address') !== -1) {
			status.innerHTML = `Error admitting to the WA on ${storedSwitchers[0].name} (nation already in WA).`;
		} else {
			status.innerHTML = `Error admitting to the WA on ${storedSwitchers[0].name} (invalid application).`;
			storedSwitchers.shift();
		}
		await browser.storage.local.set({ switchers: storedSwitchers });
	}

	async function refreshEndorse(e: MouseEvent): Promise<void> {
		const jpHappenings = document.querySelector('#jp-happenings');
		nationsToEndorse.innerHTML = '';
		jpHappenings.innerHTML = '';

		const result = await browser.storage.local.get(['jumppoint', 'endorsehappeningscount', 'currentwa', 'endorsekeywords']);

		let endorseKeywords: string[] = [];
		if (result.endorsekeywords) endorseKeywords = result.endorsekeywords;

		const maxHappeningsCount = Number(result.endorsehappeningscount) || 10;
		const jumpPoint = result.jumppoint || 'artificial_solar_system';

		let response = await makeAjaxQuery(`/page=ajax2/a=reports/view=region.${jumpPoint}/filter=move+member+endo`, 'GET');

		const nationNameRegex = new RegExp('nation=([A-Za-z0-9_-]+)');
		let div = document.createElement('div');
		div.innerHTML = response;

		let lis = div.querySelectorAll('li');
		let resigned: string[] = [];
		let happeningsAdded: number = 0;

		for (let i = 0; i < lis.length; i++) {
			if (happeningsAdded < maxHappeningsCount) {
				let liAnchors = lis[i].querySelectorAll('a');
				let images = lis[i].querySelectorAll('img');

				for (let j = 0; j < liAnchors.length; j++) liAnchors[j].href = liAnchors[j].href.replace('page=blank/', '');
				for (let j = 0; j < images.length; j++) {
					images[j].width = 12;
					images[j].height = 12;
				}

				jpHappenings.innerHTML += `<li>${lis[i].innerHTML}</li>`;
				happeningsAdded++;
			}

			const nationNameMatch = nationNameRegex.exec((lis[i].querySelector('a:nth-of-type(1)') as HTMLAnchorElement).href);
			const nationName = nationNameMatch[1];

			if (canonicalize(nationName) === canonicalize(result.currentwa)) resigned.push(nationName);
			if (nationsEndorsed.indexOf(nationName) !== -1) resigned.push(nationName);
			if (lis[i].innerHTML.indexOf('resigned from') !== -1) resigned.push(nationName);
			if (endorseKeywords.length && endorseKeywords.every((keyword) => nationName.indexOf(keyword) === -1)) {
				resigned.push(nationName);
			} else if (lis[i].innerHTML.indexOf('was admitted') !== -1) {
				if (resigned.indexOf(nationName) === -1) {
					async function onEndorseClick(e: MouseEvent) {
						const localidresult = await browser.storage.local.get('localid');
						if ((e.target as HTMLInputElement).getAttribute('data-updatedlocalid') === '1') {
							const localId = localidresult.localid;
							let formData = new FormData();
							formData.set('nation', nationName);
							formData.set('localid', localId);
							formData.set('action', 'endorse');
							let endorseResponse = await makeAjaxQuery('/cgi-bin/endorse.cgi', 'POST', formData);

							if (endorseResponse.indexOf('Failed security check.') !== -1) {
								status.innerHTML = `Failed to endorse ${nationName}.`;
								(e.target as HTMLInputElement).setAttribute('data-updatedlocalid', '0');
							} else if (endorseResponse.indexOf('Both nations must reside in the same region') !== -1) {
								status.innerHTML = `Failed to endorse ${nationName} (different region).`;
								(e.target as HTMLInputElement).setAttribute('data-clicked', '1');
								(e.target as HTMLInputElement).parentElement.removeChild(e.target as HTMLInputElement);
							} else {
								(e.target as HTMLInputElement).setAttribute('data-clicked', '1');
								status.innerHTML = `Endorsed ${nationName}.`;
								nationsEndorsed.push(nationName);
								(e.target as HTMLInputElement).parentElement.removeChild(e.target as HTMLInputElement);
							}
						} else {
							(document.querySelector('#update-localid') as HTMLInputElement).click();
							(e.target as HTMLInputElement).setAttribute('data-updatedlocalid', '1');
						}
					}

					let endorseButton: Element = document.createElement('input');
					endorseButton.setAttribute('type', 'button');
					endorseButton.setAttribute('data-clicked', '0');
					endorseButton.setAttribute('class', 'ajaxbutton endorse');
					endorseButton.setAttribute('value', `Endorse ${pretty(nationName)}`);
					endorseButton.setAttribute('data-endorsenation', nationName);
					endorseButton.setAttribute('data-updatedlocalid', '1');
					endorseButton.addEventListener('click', onEndorseClick);

					let endorseLi = document.createElement('li');
					endorseLi.appendChild(endorseButton);
					nationsToEndorse.appendChild(endorseLi);
				}
			}
		}
	}

	async function refreshDossier(e: MouseEvent): Promise<void> {
		const raiderHappenings = document.querySelector('#raider-happenings');
		raiderHappenings.innerHTML = '';
		nationsToDossier.innerHTML = '';
		const result = await browser.storage.local.get(['raiderjp', 'dossierhappeningscount', 'dossierkeywords']);
		let dossierKeywords: string[] = [];
		if (result.dossierkeywords) dossierKeywords = result.dossierkeywords;
		const maxHappeningsCount = Number(result.dossierhappeningscount) || 10;
		const raiderJp = result.raiderjp;
		let response = await makeAjaxQuery(`/page=ajax2/a=reports/view=region.${raiderJp}/filter=move+member+endo`, 'GET');
		const nationNameRegex = new RegExp('nation=([A-Za-z0-9_-]+)');
		// only so we can use queryselector on the response DOM rather than using regex matching
		let div = document.createElement('div');
		div.innerHTML = response;
		let lis = div.querySelectorAll('li');
		let resigned: string[] = [];
		let happeningsAdded: number = 0;
		for (let i = 0; i != lis.length; i++) {
			// update the raider jp happenings at the same time so we don't have to make an extra query (max 10)
			if (happeningsAdded < maxHappeningsCount) {
				let liAnchors = lis[i].querySelectorAll('a');
				let images = lis[i].querySelectorAll('img');
				// fix link
				for (let j = 0; j != liAnchors.length; j++) liAnchors[j].href = liAnchors[j].href.replace('page=blank/', '');
				// make images smaller
				for (let j = 0; j != images.length; j++) {
					images[j].width = 12;
					images[j].height = 12;
				}
				raiderHappenings.innerHTML += `<li>${lis[i].innerHTML}</li>`;
				happeningsAdded++;
			}
			const nationNameMatch = nationNameRegex.exec((lis[i].querySelector('a:nth-of-type(1)') as HTMLAnchorElement).href);
			const nationName = nationNameMatch[1];
			// don't let us dossier the same nation twice
			if (nationsDossiered.indexOf(nationName) !== -1) resigned.push(nationName);
			// Don't include nations that probably aren't in the WA
			if (lis[i].innerHTML.indexOf('resigned from') !== -1) resigned.push(nationName);
			if (dossierKeywords.length && dossierKeywords.every((keyword) => nationName.indexOf(keyword) === -1)) {
				resigned.push(nationName);
			} else if (lis[i].innerHTML.indexOf('was admitted') !== -1) {
				if (resigned.indexOf(nationName) === -1) {
					async function onDossierClick(e: MouseEvent): Promise<void> {
						(e.target as HTMLInputElement).setAttribute('data-clicked', '1');
						const chk: string = (await browser.storage.local.get('chk')).chk;
						let formData = new FormData();
						formData.set('nation', nationName);
						formData.set('action', 'add');
						formData.set('chk', chk);
						let dossierResponse: string = await makeAjaxQuery('/page=dossier', 'POST', formData);
						if (dossierResponse.indexOf('has been added to your Dossier.') !== -1) {
							status.innerHTML = `Dossiered ${nationName}`;
							nationsDossiered.push(nationName);
							(e.target as HTMLInputElement).parentElement.removeChild(e.target as HTMLInputElement);
						} else status.innerHTML = `Failed to dossier ${nationName}.`;
					}

					let dossierButton = document.createElement('input');
					dossierButton.setAttribute('type', 'button');
					dossierButton.setAttribute('class', 'ajaxbutton dossier');
					// so our key doesn't click it more than once
					dossierButton.setAttribute('data-clicked', '0');
					dossierButton.setAttribute('value', `Dossier ${pretty(nationName)}`);
					dossierButton.addEventListener('click', onDossierClick);
					let dossierLi = document.createElement('li');
					dossierLi.appendChild(dossierButton);
					nationsToDossier.appendChild(dossierLi);
				}
			}
		}
	}

	function setRaiderJP(e: MouseEvent): void {
		const newRaiderJP = canonicalize((document.querySelector('#raider-jp') as HTMLInputElement).value);
		browser.storage.local.set({ raiderjp: newRaiderJP });
		notyf.success(`Set raider JP to ${newRaiderJP}`);
		(document.querySelector('#raider-jp') as HTMLInputElement).value = '';
	}

	async function moveToJP(e: MouseEvent): Promise<void> {
		const button = e.target as HTMLInputElement;

		if (button.value === 'Move to JP') {
			const localidresult = await browser.storage.local.get('localid');
			const jumppointresult = await browser.storage.local.get('jumppoint');

			const localId = localidresult.localid;
			const moveRegion = jumppointresult.jumppoint;

			button.disabled = true;
			button.value = 'Moving...';

			let formData = new FormData();
			formData.set('localid', localId);
			formData.set('region_name', moveRegion);
			formData.set('move_region', '1');

			const response = await makeAjaxQuery('/page=change_region', 'POST', formData);

			if (response.indexOf('This request failed a security check.') !== -1) {
				status.innerHTML = `Failed to move to ${moveRegion}.`;
			} else {
				status.innerHTML = `Moved to ${moveRegion}`;
				currentRegion.innerHTML = moveRegion;
			}

			button.disabled = false;
			button.value = 'Update Localid';
		} else if (button.value === 'Update Localid') {
			manualLocalIdUpdate(e);
			button.value = 'Move to JP';
		}
	}

	async function chasingButton(e: MouseEvent): Promise<void> {
		// jump points and such
		const result = await browser.storage.local.get('blockedregions');
		const doNotMove: string[] = result.blockedregions || [];

		if ((e.target as HTMLInputElement).value == 'Refresh') {
			let response = await makeAjaxQuery('/template-overall=none/page=reports', 'GET');
			// only so we can use queryselector on the response DOM rather than using regex matching
			let responseDiv = document.createElement('div');
			responseDiv.innerHTML = response;
			let lis = responseDiv.querySelectorAll('li');
			reportsTime.innerHTML = (responseDiv.querySelector('input[name=report_hours]') as HTMLInputElement).value;
			// add the reports items to the page so we don't have to make a second query for it
			reports.innerHTML = '';
			const result = await browser.storage.local.get('reportscount');
			const maxReportsCount = parseInt(result.reportscount) || 10;
			let reportsAdded: number = 0;
			for (let i = 0; i !== lis.length; i++) {
				if (reportsAdded === maxReportsCount) break;
				let liAnchors = lis[i].querySelectorAll('a');
				let images = lis[i].querySelectorAll('img');
				// fix link
				for (let j = 0; j != liAnchors.length; j++) liAnchors[j].href = liAnchors[j].href.replace('page=blank/', '');
				// make images smaller
				for (let j = 0; j != images.length; j++) {
					images[j].width = 12;
					images[j].height = 12;
				}
				reports.innerHTML += `<li>${lis[i].innerHTML}</li>`;
				reportsAdded++;
			}
			let moveRegion = responseDiv.querySelector('.rlink:nth-of-type(3)');
			if (!moveRegion) return;
			let moveRegionValue = canonicalize(moveRegion.innerHTML);
			if (doNotMove.indexOf(moveRegionValue) !== -1) return;
			// don't allow us to move to the same region
			if (moveRegionValue === currentRegion.innerHTML) return;
			let moveRegionParent = moveRegion.parentElement;
			let movingNation: string = canonicalize(moveRegionParent.querySelector('.nnameblock').innerHTML);
			if (moveRegionParent.innerHTML.indexOf('relocated from') === -1) return;
			if (typeof moveCounts[moveRegionValue] === 'undefined') moveCounts[moveRegionValue] = [movingNation];
			else if (moveCounts[moveRegionValue].indexOf(movingNation) === -1) moveCounts[moveRegionValue].push(movingNation);
			(e.target as HTMLInputElement).value = `Move!`;
			(e.target as HTMLInputElement).setAttribute('data-moveregion', moveRegionValue);
		} else if ((e.target as HTMLInputElement).getAttribute('data-moveregion')) {
			const result = await browser.storage.local.get('localid');
			const localId = result.localid;
			const moveRegion = (e.target as HTMLInputElement).getAttribute('data-moveregion');
			let formData = new FormData();
			formData.set('localid', localId);
			formData.set('region_name', moveRegion);
			formData.set('move_region', '1');
			let response = await makeAjaxQuery('/page=change_region', 'POST', formData);
			if (response.indexOf('This request failed a security check.') !== -1) status.innerHTML = `Failed to move to ${moveRegion}.`;
			else {
				status.innerHTML = `Moved to ${moveRegion}`;
				currentRegion.innerHTML = moveRegion;
			}
			(e.target as HTMLInputElement).value = 'Update Localid';
			(e.target as HTMLInputElement).setAttribute('data-moveregion', '');
			document.querySelector('#wa-delegate').innerHTML = 'N/A';
			document.querySelector('#last-wa-update').innerHTML = 'N/A';
		} else if ((e.target as HTMLInputElement).value == 'Update Localid') {
			manualLocalIdUpdate(e);
			(e.target as HTMLInputElement).value = 'Refresh';
		}
	}

	async function updateRegionStatus(e: MouseEvent): Promise<void> {
		if (currentRegion.innerHTML == 'N/A') return;
		const nationRegex: RegExp = new RegExp('nation=([A-Za-z0-9_-]+)');
		let response = await makeAjaxQuery(`/template-overall=none/region=${currentRegion.innerHTML}`, 'GET');
		const responseDocument = document.createRange().createContextualFragment(response);
		// update the region happenings at the same time to not make an extra query
		const result = await browser.storage.local.get('regionhappeningscount');
		let regionHappeningsCount: number = Number(result.regionhappeningscount) || 10;
		let regionHappeningsLis = responseDocument.querySelectorAll('ul > li');
		regionHappenings.innerHTML = '';
		for (let i = 0; i != regionHappeningsCount; i++) {
			let anodes = regionHappeningsLis[i].querySelectorAll('a');
			let images = regionHappeningsLis[i].querySelectorAll('img');
			// fix link
			for (let j = 0; j != anodes.length; j++) anodes[j].href = anodes[j].href.replace('page=blank/', '');
			// make images smaller
			for (let j = 0; j != images.length; j++) {
				images[j].width = 12;
				images[j].height = 12;
			}
			regionHappenings.innerHTML += `<li>${regionHappeningsLis[i].innerHTML}</li>`;
		}
		const updatedWaDelegate = responseDocument.querySelector('#regioncontent > p:nth-child(2) > a > span');

		if (updatedWaDelegate) {
			document.querySelector('#wa-delegate').innerHTML = updatedWaDelegate.innerHTML;
			(document.querySelector('#delegate-nation') as HTMLInputElement).value = updatedWaDelegate.querySelector('.nname').innerHTML;
		} else {
			document.querySelector('#wa-delegate').innerHTML = 'None.';
		}
		const lastWaUpdate = responseDocument.querySelector('#regioncontent > p:nth-child(4) > time').innerHTML;
		document.querySelector('#last-wa-update').innerHTML = lastWaUpdate;
	}

	async function checkCurrentRegion(e: MouseEvent): Promise<void> {
		let response = await makeAjaxQuery('/region=artificial_solar_system', 'GET');
		let responseElement = document.createRange().createContextualFragment(response);
		let regionHref = (responseElement.querySelector('#panelregionbar > a') as HTMLAnchorElement).href;
		currentRegion.innerHTML = new RegExp('region=([A-Za-z0-9_]+)').exec(regionHref)[1];
	}

	async function endorseDelegate(e: MouseEvent): Promise<void> {
		const localidresult = await browser.storage.local.get('localid');
		const nationName = (document.querySelector('#delegate-nation') as HTMLInputElement).value;
		if (nationName === 'N/A') return;
		const localId = localidresult.localid;
		let formData = new FormData();
		formData.set('nation', nationName);
		formData.set('localid', localId);
		formData.set('action', 'endorse');
		let endorseResponse = await makeAjaxQuery('/cgi-bin/endorse.cgi', 'POST', formData);
		if (endorseResponse.indexOf('Failed security check.') !== -1) status.innerHTML = `Failed to endorse ${nationName}.`;
		else status.innerHTML = `Endorsed ${nationName}.`;
	}

	async function checkIfUpdated(e: MouseEvent): Promise<void> {
		didIUpdate.innerHTML = '';
		let responseDiv = document.createElement('div');
		responseDiv.innerHTML = await makeAjaxQuery('/page=ajax2/a=reports/view=self/filter=change', 'GET');
		let lis = responseDiv.querySelectorAll('li');
		// limit to max 5 happenings to save space
		for (let i = 0; i != 3; i++) {
			if (typeof lis[i] === 'undefined') break;
			else {
				// resize image
				let images = lis[i].querySelectorAll('img');
				for (let j = 0; j != images.length; j++) {
					images[j].width = 12;
					images[j].height = 12;
				}
				didIUpdate.innerHTML += `<li>${lis[i].innerHTML}</li>`;
			}
		}
	}

	async function updateWorldHappenings(e: MouseEvent): Promise<void> {
		worldHappenings.innerHTML = '';
		let response: string = await makeAjaxQuery('/page=ajax2/a=reports/view=world/filter=move+member+endo', 'GET');
		let responseElement: DocumentFragment = document.createRange().createContextualFragment(response);
		let lis = responseElement.querySelectorAll('li');
		// max 10
		const result = await browser.storage.local.get('worldhappeningscount');
		let maxHappeningsCount = Number(result.worldhappeningscount) || 10;
		for (let i = 0; i < maxHappeningsCount; i++) {
			let liAnchors = lis[i].querySelectorAll('a');
			const images = lis[i].querySelectorAll('img');
			// fix link
			for (let j = 0; j != liAnchors.length; j++) liAnchors[j].href = liAnchors[j].href.replace('page=blank/', '');
			// make images smaller
			for (let j = 0; j != images.length; j++) {
				images[j].width = 12;
				images[j].height = 12;
			}
			worldHappenings.innerHTML += `<li>${lis[i].innerHTML}</li>`;
		}
	}

	function copyWin(e: MouseEvent): void {
		// https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
		let copyText = document.createElement('textarea');
		copyText.value = `W: https://www.nationstates.net/region=${currentRegion.innerHTML}`;
		document.body.appendChild(copyText);
		copyText.select();
		document.execCommand('copy');
		document.body.removeChild(copyText);
	}

	function copyOrders(e: MouseEvent): void {
		// https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
		let copyText = document.createElement('textarea');
		const delegateNation: string = (document.querySelector('#delegate-nation') as HTMLInputElement).value;
		if (document.querySelector('#last-wa-update').innerHTML.indexOf('hour') === -1) return;
		else if (delegateNation.indexOf('N/A') !== -1) return;
		copyText.value = `@here **NOW**\nMove to: https://www.nationstates.net/region=${currentRegion.innerHTML}\nThen endorse: https://www.nationstates.net/nation=${delegateNation}`;
		document.body.appendChild(copyText);
		copyText.select();
		document.execCommand('copy');
		document.body.removeChild(copyText);
	}

	function openRegion(e: MouseEvent): void {
		const regionUrl = document.querySelector('#current-region').innerHTML;
		window.open(`/region=${regionUrl}`);
	}

	// Update the list of switchers as soon as a new WA admit page is opened
	function onStorageChange(changes: object): void {
		for (let key in changes) {
			let storageChange = changes[key];
			if (key === 'switchers') {
				const newSwitchers: Switcher[] = storageChange.newValue;
				(document.querySelector('#num-switchers') as HTMLSpanElement).innerHTML = String(newSwitchers.length);
			} else if (key === 'currentwa') currentWANation.innerHTML = storageChange.newValue || 'N/A';
		}
	}

	/*
	 * Event Listeners
	 */

	document.querySelector('#resign').addEventListener('click', resignWA);
	document.querySelector('#admit').addEventListener('click', admitWA);
	document.querySelector('#refresh-endorse').addEventListener('click', refreshEndorse);
	document.querySelector('#refresh-dossier').addEventListener('click', refreshDossier);
	document.querySelector('#set-raider-jp').addEventListener('click', setRaiderJP);
	document.querySelector('#move-to-jp').addEventListener('click', moveToJP);
	document.querySelector('#chasing-button').addEventListener('click', chasingButton);
	document.querySelector('#update-localid').addEventListener('click', manualLocalIdUpdate);
	document.querySelector('#update-wa-status').addEventListener('click', manualChkUpdate);
	document.querySelector('#update-region-status').addEventListener('click', updateRegionStatus);
	document.querySelector('#check-current-region').addEventListener('click', checkCurrentRegion);
	document.querySelector('#check-if-updated').addEventListener('click', checkIfUpdated);
	document.querySelector('#copy-win').addEventListener('click', copyWin);
	document.querySelector('#endorse-delegate').addEventListener('click', endorseDelegate);
	document.querySelector('#update-world-happenings').addEventListener('click', updateWorldHappenings);
	document.querySelector('#open-region').addEventListener('click', openRegion);
	document.querySelector('#copy-orders').addEventListener('click', copyOrders);
	document.addEventListener('keyup', keyPress);
	browser.storage.onChanged.addListener(onStorageChange);

	/*
	 * Initialization
	 */

	try {
		const result = await browser.storage.local.get(['switchers', 'currentwa']);

		document.querySelector('#num-switchers').innerHTML = result.switchers?.length.toString() || '0';

		currentWANation.innerHTML = result.currentwa || 'N/A';
	} catch (e) {
		if (e instanceof TypeError) {
		}
	}
})();
