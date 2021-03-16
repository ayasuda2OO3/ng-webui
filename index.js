/*
 * Copyright (c) 2020 General Electric Company. All rights reserved.
 * The copyright to the computer software herein is the property of
 * General Electric Company. The software may be used and/or copied only
 * with the written permission of General Electric Company or in accordance
 * with the terms and conditions stipulated in the agreement/contract
 * under which the software has been supplied.
 *
 * author: apolo.yasuda@ge.com
 */

import EC from './ec.js'

(()=>{

    let _s = window.location.pathname.split('/')
      , ec = new EC('ec1',window.location.host,_s[1],_s[2]);
    window.ec = ec;
    ec.TenguObjInit().catch(err=>{
        console.error(`TenguObjInit failed: ${err}`)
    }
    ).then(keys=>{
        ec.load("https://code.jquery.com/jquery-3.5.1.slim.min.js").catch((err)=>{}
        ).then((s)=>{
            ec.windowEventBinder();

            ec.load("https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.min.js").then((success)=>{

                showdown.extension('header-anchors', ()=>{
                    var ancTpl = '$1<a id="user-content-$3" class="anchor" href="#$3" aria-hidden="true"><svg aria-hidden="true" class="octicon octicon-link" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg></a>$4';
                    return [{
                        type: 'html',
                        regex: /(<h([1-5]) id="([^"]+?)">)(.*<\/h\2>)/g,
                        replace: ancTpl
                    }];
                }
                );

                let marked = new showdown.Converter({
                    extensions: ['header-anchors'],
                    ghCompatibleHeaderId: true
                });

                let ay = ec.getNgObjVal('ay');

                ec.TenguAPI('ip').then(data1=>{
                    data1.list.split(', ').forEach((ip)=>{
                        if (!ip.startsWith('10.')) {
                            ec.Api(`${ay.cred.ipdata.url}/${ip}?${ay.cred.ipdata.key}=${ay.cred.ipdata.value}`).then((data)=>{
                                //console.log(`geo svc: ${data} browsHistory: ${ec.getNgObjVal('browseHistory')}`);                                         
                                let bh = ec.getNgObjByName('browseHistory')
                                  , ipd = {
                                    ip: ip,
                                    lat: data.latitude,
                                    lng: data.longitude,
                                    city: data.city,
                                    country: data.country_name,
                                    zip: data.postal,
                                    state: data.region_code
                                };

                                //if (bh['list']) {
                                //    bh['list'][`${ts}`] = ipd;
                                //    ec.setNgObj(bh.key, bh);
                                //}

                                return ec.TenguAPI(bh.key, ipd, 'POST').then((data)=>{
                                    //console.log(`geolocation updated. ${JSON.stringify(data)}`);        
                                    ec.setNgObj(bh.key, data);
                                    ec.routing();
                                }
                                );
                            }
                            ).catch(e=>{
                                console.log(`Exception: ${e}`);
                            }
                            );
                        }
                    }
                    );

                }
                ).catch(e=>{
                    console.log(`get up err: ${e}`)
                }
                );

                $('ul').on('click', 'li.ec-godoc', (event)=>{

                    ec.setActiveTab(event.target, `${ec.appPath}/godoc`);
                    event.preventDefault();
                    if (ec.sdkInnerHTML != "") {
                        $("main").html(ec.sdkInnerHTML);
                        return;
                    }

                    ec.Api('https://api.github.com/repos/ec-release/ng-webui/contents/godoc').then((data)=>{
                        let htmlString = `<table class="table text-center table-striped"><caption>Agent SDK Matrix</caption><thead><tr>` + `<th scope="col" class="text-left">Rev</th>` + `<th scope="col">Go</th>` + `<th scope="col">Java</th>` + `<th scope="col">C++</th>` + `<th scope="col">NodeJS</th>` + `</tr></thead><tbody>`;
                        for (let file of data) {
                            if (file.type == "dir") {
                                htmlString += `<tr><th scope="row" class="text-left">${file.name}</th>` + `<td>${ec.getBoolIcon(true, file.path)}</td>` + `<td>${ec.getBoolIcon(false, file.path)}</td>` + `<td>${ec.getBoolIcon(true, file.path)}</td>` + `<td>${ec.getBoolIcon(false, file.path)}</td>` + `</tr>`;
                            }
                        }
                        htmlString += '</tbody></table>';
                        ec.sdkInnerHTML = htmlString;
                        $("main").html(ec.sdkInnerHTML);
                        $(event.target).addClass('active');
                    }
                    ).catch((e)=>{
                        console.log(`Exception: ${e}`);
                    }
                    );
                }
                );

                $('ul').on('click', 'li.ec-releases', (event)=>{

                    ec.setActiveTab(event.target, `${ec.appPath}/releases`);

                    event.preventDefault();
                    if (ec.Releases != "") {
                        $("main").html(ec.Releases);
                        return;
                    }

                    ec.Api('https://api.github.com/repos/ec-release/sdk/releases').then((data)=>{
                        let htmlString = `<table class="table table-striped"><caption>Release Matrix</caption><thead><tr><th scope="col">Rev</th><th scope="col">Release Note</th></tr></thead><tbody>`;
                        for (let rel of data) {
                            htmlString += `<tr><th scope="row">${rel.name}</th><td>${marked.makeHtml(rel.body)}</td></tr>`;
                        }
                        htmlString += '</tbody></table>';
                        ec.Releases = htmlString;
                        $("main").html(ec.Releases);
                        $(event.target).addClass('active');
                    }
                    ).catch((e)=>{
                        console.log(`Exception: ${e}`);
                    }
                    );
                }
                );

                $('ul').on('click', 'li.ec-status', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/status`);
                    event.preventDefault();

                    let up = (url)=>{
                        var _u = new URL(url);
                        return _u.hostname.split('.')[0];
                    }

                    let st = (code)=>{
                        switch (code) {
                        case 1006:
                            return feather.icons['sun'].toSvg({
                                'color': 'grey'
                            });
                        case 1007:
                            return feather.icons['pause-circle'].toSvg({
                                'color': 'grey'
                            });
                        case 1008:
                            return feather.icons['alert-triangle'].toSvg({
                                'color': 'grey'
                            });
                        case 1009:
                            return feather.icons['eye-off'].toSvg({
                                'color': 'grey'
                            });
                        default:
                            return feather.icons['help-circle'].toSvg({
                                'color': 'grey'
                            });
                        }
                    }

                    let refreshOps = (node)=>{
                        //if (node.startsWith(`https://${ec.appHost}`)) {
                            return `<a class="ec-seed-reboot" href="javascript:void(0)" ec-node="${node}">${feather.icons['refresh-cw'].toSvg({
                                'color': 'green'
                            })}</a>`;
                        //}

                        //return '&nbsp;';
                    }

                    let debugOps = (node)=>{
                        //if (node.startsWith(`https://${ec.appHost}`)) {
                            return `<a class="ec-seed-debug" href="javascript:void(0)" ec-node="${node}">${feather.icons['monitor'].toSvg({
                                'color': 'blue'
                            })}</a>`;
                        //}

                        //return '&nbsp;';
                    }

                    let remoteOps = (node)=>{
                        //if (node.startsWith(`https://${ec.appHost}`)) {
                            return `<a class="ec-seed-term" href="javascript:void(0)" ec-node="${node}">${feather.icons['terminal'].toSvg({
                                color: 'black',
                                'border-radius': '3px'
                            })}</a>`;
                        //}

                        //return '&nbsp;';
                    }

                    //ec.attachWorker(`${ec.assetPath}/worker.js`);

                    ec.TenguAPI('seed', '', 'GET').then(data=>{
                        let htmlString = `<table class="table texsht-center table-striped"><caption>System Mining</caption><thead><tr>` + `<th scope="col">Sequence</th>` + `<th scope="col" class="text-left">Seeder</th>` + `<th scope="col">Ancestor</th>` + `<th scope="col">OAuth</th>` + `<th scope="col">Status</th>` + `<th scope="col">Retry</th>` + `<th scope="col">Reboot</th>` + `<th scope="col">Debug</th>` + `<th scope="col">Remote</th>` + `<th scope="col" class="text-left">Updated On</th>` + `<th scope="col" class="text-left">Joined On</th>` + `</tr></thead><tbody>`;

                        let sdArr = Object.values(data);
                        sdArr.sort((a,b)=>{
                            return a.SeqID - b.SeqID;
                        }
                        );

                        sdArr.forEach((seed,idx)=>{
                            htmlString += `<tr><td>${seed.SeqID}</td>` + `<th scope="row" class="text-left"><a class="ec-seed-link" href="${seed.Node}">${up(seed.Node)}</a></th>` + `<td><a class="ec-seed-link" href="${seed.Seed}">${up(seed.Seed)}</a></td>` + `<td><a class="ec-oauth-link" href="${seed.OAuth}">${up(seed.OAuth)}</a></td>` + `<td>${st(seed.Status)}</td>` + `<td>${seed.Retry}</td>` + `<td>${refreshOps(seed.Node)}</td>` + `<td>${debugOps(seed.Node)}</td>` + `<td>${remoteOps(seed.Node)}</td>` + `<td>${ec.timeStrConv(seed.UpdatedOn * 1000)}</td>` + `<td>${ec.timeStrConv(seed.CreatedOn * 1000)}</td></tr>`;
                        }
                        );

                        htmlString += '</table>';

                        let bh = ec.getNgObjByName('browseHistory');
                        if (bh) {

                            let bhArr = Object.values(bh.list);

                            let groupBy = (xs,key)=>{
                                return xs.reduce(function(rv, x) {
                                    (rv[x[key]] = rv[x[key]] || []).push(x);
                                    return rv;
                                }, {});
                            }
                            ;
                            let hits = groupBy(bhArr, 'ip');

                            htmlString += `<table class="table text-center table-striped"><caption>Usage Geo-reporting</caption><thead><tr>` + `<th scope="col" class="text-left">Ip</th>` + `<th scope="col">LAT</th>` + `<th scope="col">LNG</th>` + `<th scope="col">City</th>` + `<th scope="col">Visit</th>` + `</tr></thead><tbody>`;

                            for (const [ip,grp] of Object.entries(hits)) {
                                let histry = grp[0]
                                  , visit = grp.length;
                                htmlString += `<tr><th scope="row" class="text-left">${ip}</th>` + `<td>${histry.lat}</td>` + `<td>${histry.lng}</td>` + `<td>${histry.city}</td>` + `<td>${visit}</td></tr>`;
                            }
                            htmlString += '</table>';

                        }
                        $("main").html(htmlString);
                        $('.ec-seed-reboot > svg').on('click', (e)=>{
                            e.preventDefault();
                            if (!$(e.target).parent().hasClass('ec-seed-reboot')) {
                                return;
                            }

                            let _o = 0
			      , nodeURL = $(e.target).parent().attr("ec-node")
                              , ref2 = setInterval(()=>{
                                _o += 10;
                                $(e.target).css({
                                    transform: `rotate(${_o}deg)`,
                                    color: 'red'
                                });
                            }
                            , 100)
                              , ref3 = setInterval(()=>{
                                ec.TenguSeederAPI(`${ec.apiPath}/seed`, 'GET').then(d=>{
                                //ec.TenguSeederAPI(`${ec.apiPath}/seed`, 'GET').then(d=>{
                                    clearInterval(ref2);
                                    clearInterval(ref3);
                                    $(e.target).css({
                                        transform: `rotate(${_o}deg)`,
                                        color: 'green'
                                    });
                                    console.log(`seeder re-instated.`);
                                }
                                ).catch(e=>{
                                    console.log(`seeder reboot in-progress.`);
                                }
                                );
                            }
                            , 5000);

                            ec.TenguSeederAPI(`${ec.appExit}`, 'POST').then(d=>{
                                console.log(`seeder is being rebooted. d: ${d}`);
                            }
                            ).catch(e=>{
                                console.log(`error whilst rebooting. e: ${e}`);
                            }
                            );
                        }
                        );

                        $('.ec-seed-debug > svg').on('click', (e)=>{
                            e.preventDefault();
                            ec.showRemoteDebug(`wss://${ec.appHost + ec.appLog}`);
                        }
                        );

                        $('.ec-seed-term > svg').on('click', (e)=>{
                            e.preventDefault();
                            ec.showTerminal(`wss://${ec.appHost + ec.appTerm}`);
                        }
                        );

                        $(event.target).addClass('active');
                    }
                    ).catch((e)=>{
                        console.log(`Exception: ${e}`);
                        location.reload();
                    }
                    );

                }
                );

                $('ul').on('click', 'li.ec-scheduler', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/scheduler`);
                    event.preventDefault();

                    let htmlString = `<table class="table text-center table-striped"><caption>Script Scheduler</caption><thead><tr>` + `<th scope="col" class="text-left">git commit</th>` + `<th scope="col">repo vendor</th>` + `<th scope="col">time</th><th scope="col">title</th><th scope="col">freq</th><th scope="col"></th><th scope="col"></th><th scope="col"></th></tr></thead><tbody>`;

                    let op = ec.getNgObjArrByParentKey("04888c44-4adb-4845-a31e-cd33e336b0a1");
                    op.forEach((value,index)=>{
                        htmlString += `<tr><td scope="row" class="text-left"><a href="${value.downloadURL}">${value.gitCommit.substring(0, 10)}</td>` + `<td>${value.vendor}</td>` + `<td>${ec.timeStrConv(value.startDate)}</td>` + `<td>${value.title}</td>` + `<td>${value.freq}</td><td><a class="ec-exec-scheduler" ec-data="${value.key}" href="javascript:void(0);">${feather.icons['corner-down-left'].toSvg({
                            'color': 'blue'
                        })}</a></td><td><a class="ec-show-scheduler-form" ec-data="${value.key}" href="javascript:void(0);">${feather.icons['edit'].toSvg({
                            'color': 'darkgreen'
                        })}</a></td><td><a class="ec-delete-scheduler" ec-data="${value.key}" href="javascript:void(0);">${feather.icons['delete'].toSvg({
                            'color': 'darkred'
                        })}</a></td></tr>`;

                    }
                    );

                    htmlString += `</table>`;
                    htmlString += `<button type="button" class="btn btn-primary ec-show-scheduler-form">Schedule An Executor</button>`

                    $("main").html(htmlString);
                    $('a.ec-exec-scheduler').on('click', (e)=>{
                        e.preventDefault();
                        ec.showTerminal(`wss://${ec.appHost + ec.appExec}?eid=${$(e.target).closest('a').attr('ec-data')}`);
                    }
                    );
			
		    $('a.ec-show-scheduler-form').on('click', (e)=>{
                        e.preventDefault();
                        ec.showSchedulerForm($(e.target).closest('a').attr('ec-data'));
                    }
                    );

			
                    $('a.ec-delete-scheduler').on('click', (e)=>{
                        e.preventDefault();
                        ec.showDeleteConfirm($(e.target).closest('a').attr('ec-data'));
                    }
                    );

                    $('button.ec-show-scheduler-form').on('click', (e)=>{
                        e.preventDefault();
                        ec.showSchedulerForm();
                    }
                    );

                    $(event.target).addClass('active');
                }
                );

                $('ul').on('click', 'li.ec-social', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/social`);
                    event.preventDefault();

                    $("main").html(`<div class="container p-0">

		<h1 class="h3 mb-3">EC Social (WIP)</h1>

		<div class="card">
			<div class="row g-0">
				<div class="col-12 col-lg-5 col-xl-3 border-right">

					<div class="px-4 d-none d-md-block">
						<div class="d-flex align-items-center">
							<div class="flex-grow-1">
								<input type="text" class="form-control my-3" placeholder="Search...">
							</div>
						</div>
					</div>

					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="badge bg-success float-right">5</div>
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar5.png" class="rounded-circle mr-1" alt="Vanessa Tucker" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								Vanessa Tucker
								<div class="small"><span class="fas fa-circle chat-online"></span> Online</div>
							</div>
						</div>
					</a>
					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="badge bg-success float-right">2</div>
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar2.png" class="rounded-circle mr-1" alt="William Harris" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								William Harris
								<div class="small"><span class="fas fa-circle chat-online"></span> Online</div>
							</div>
						</div>
					</a>
					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								Sharon Lessman
								<div class="small"><span class="fas fa-circle chat-online"></span> Online</div>
							</div>
						</div>
					</a>
					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar4.png" class="rounded-circle mr-1" alt="Christina Mason" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								Christina Mason
								<div class="small"><span class="fas fa-circle chat-offline"></span> Offline</div>
							</div>
						</div>
					</a>
					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar5.png" class="rounded-circle mr-1" alt="Fiona Green" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								Fiona Green
								<div class="small"><span class="fas fa-circle chat-offline"></span> Offline</div>
							</div>
						</div>
					</a>
					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar2.png" class="rounded-circle mr-1" alt="Doris Wilder" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								Doris Wilder
								<div class="small"><span class="fas fa-circle chat-offline"></span> Offline</div>
							</div>
						</div>
					</a>
					<a href="#" class="list-group-item list-group-item-action border-0">
						<div class="d-flex align-items-start">
							<img src="https://bootdey.com/img/Content/avatar/avatar4.png" class="rounded-circle mr-1" alt="Haley Kennedy" width="40" height="40">
							<div class="flex-grow-1 ml-3">
								Haley Kennedy
								<div class="small"><span class="fas fa-circle chat-offline"></span> Offline</div>
							</div>
						</div>
					</a>
					<hr class="d-block d-lg-none mt-1 mb-0">
				</div>
				<div class="col-12 col-lg-7 col-xl-9">
					<div class="py-2 px-4 border-bottom d-none d-lg-block">
						<div class="d-flex align-items-center py-1">
							<div class="position-relative">
								<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
							</div>
							<div class="flex-grow-1 pl-3">
								<strong>Sharon Lessman</strong>
								<div class="text-muted small"><em>Typing...</em></div>
							</div>
							<div>
								<button class="btn btn-primary btn-lg mr-1 px-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-phone feather-lg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></button>
								<button class="btn btn-info btn-lg mr-1 px-3 d-none d-md-inline-block"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video feather-lg"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></button>
								<button class="btn btn-light border btn-lg px-3"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-more-horizontal feather-lg"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></button>
							</div>
						</div>
					</div>

					<div class="position-relative">
						<div class="chat-messages p-4">

							<div class="chat-message-right pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:33 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
									<div class="font-weight-bold mb-1">You</div>
									Lorem ipsum dolor sit amet, vis erat denique in, dicunt prodesset te vix.
								</div>
							</div>

							<div class="chat-message-left pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:34 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
									<div class="font-weight-bold mb-1">Sharon Lessman</div>
									Sit meis deleniti eu, pri vidit meliore docendi ut, an eum erat animal commodo.
								</div>
							</div>

							<div class="chat-message-right mb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:35 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
									<div class="font-weight-bold mb-1">You</div>
									Cum ea graeci tractatos.
								</div>
							</div>

							<div class="chat-message-left pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:36 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
									<div class="font-weight-bold mb-1">Sharon Lessman</div>
									Sed pulvinar, massa vitae interdum pulvinar, risus lectus porttitor magna, vitae commodo lectus mauris et velit.
									Proin ultricies placerat imperdiet. Morbi varius quam ac venenatis tempus.
								</div>
							</div>

							<div class="chat-message-left pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:37 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
									<div class="font-weight-bold mb-1">Sharon Lessman</div>
									Cras pulvinar, sapien id vehicula aliquet, diam velit elementum orci.
								</div>
							</div>

							<div class="chat-message-right mb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:38 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
									<div class="font-weight-bold mb-1">You</div>
									Lorem ipsum dolor sit amet, vis erat denique in, dicunt prodesset te vix.
								</div>
							</div>

							<div class="chat-message-left pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:39 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
									<div class="font-weight-bold mb-1">Sharon Lessman</div>
									Sit meis deleniti eu, pri vidit meliore docendi ut, an eum erat animal commodo.
								</div>
							</div>

							<div class="chat-message-right mb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:40 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
									<div class="font-weight-bold mb-1">You</div>
									Cum ea graeci tractatos.
								</div>
							</div>

							<div class="chat-message-right mb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:41 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
									<div class="font-weight-bold mb-1">You</div>
									Morbi finibus, lorem id placerat ullamcorper, nunc enim ultrices massa, id dignissim metus urna eget purus.
								</div>
							</div>

							<div class="chat-message-left pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:42 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
									<div class="font-weight-bold mb-1">Sharon Lessman</div>
									Sed pulvinar, massa vitae interdum pulvinar, risus lectus porttitor magna, vitae commodo lectus mauris et velit.
									Proin ultricies placerat imperdiet. Morbi varius quam ac venenatis tempus.
								</div>
							</div>

							<div class="chat-message-right mb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar1.png" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:43 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
									<div class="font-weight-bold mb-1">You</div>
									Lorem ipsum dolor sit amet, vis erat denique in, dicunt prodesset te vix.
								</div>
							</div>

							<div class="chat-message-left pb-4">
								<div>
									<img src="https://bootdey.com/img/Content/avatar/avatar3.png" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
									<div class="text-muted small text-nowrap mt-2">2:44 am</div>
								</div>
								<div class="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
									<div class="font-weight-bold mb-1">Sharon Lessman</div>
									Sit meis deleniti eu, pri vidit meliore docendi ut, an eum erat animal commodo.
								</div>
							</div>

						</div>
					</div>

					<div class="flex-grow-0 py-3 px-4 border-top">
						<div class="input-group">
							<input type="text" class="form-control" placeholder="Type your message">
							<button class="btn btn-primary">Send</button>
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>`);
                    $(event.target).addClass('active');
                }
                );

                $('ul').on('click', 'li.ec-security', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/security`);
                    event.preventDefault();

                    if (ec.securityMd != "") {
                        $("main").html(marked.makeHtml(ec.securityMd));
                        $(event.target).addClass('active');

                        return;
                    }

                    ec.Html('https://raw.githubusercontent.com/EC-Release/sdk/v1_security_review/vulnerability/predix.README.md').then((data)=>{

                        ec.securityMd = '<div class="mt-3">' + marked.makeHtml(data) + '</div>';
                        $("main").html(ec.securityMd);
                        $(event.target).addClass('active');
                    }
                    );
                }
                );

                $('ul').on('click', 'li.ec-analytics', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/analytics`);
                    event.preventDefault();
                    //if (document.getElementsByClassName('ec-info').length<1) { 
                    $('.ec-info').remove();
                    $('body').append($('<div class="ec-info"></div>').css({
                        position: "fixed",
                        left: $('body')[0].getBoundingClientRect().width - 100,
                        bottom: 20,
                        color: 'grey'
                    }).text('[ + data@EC ]').on("click", (e)=>{
                        e.preventDefault();
                        ec.TenguDataInit('qa');
                        ec.showDataModel();
                    }
                    ));
                    //}

                    if (ec.ngObjSize > 0) {
                        ec.showTenguChartI();
                        $(event.target).addClass('active');
                    } else {
                        console.log(`no data obj available`);
                    }
                }
                );

                $('ul').on('click', 'li.ec-visualisation', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/visualisation`);
                    event.preventDefault();
                    //if (document.getElementsByClassName('ec-info').length<1) {                
                    $('.ec-info').remove();
                    $('body').append($('<div class="ec-info"></div>').css({
                        position: "fixed",
                        left: $('body')[0].getBoundingClientRect().width - 100,
                        bottom: 20,
                        color: 'grey'
                    }).text('[ + data@EC ]').on("click", (e)=>{
                        e.preventDefault();
                        ec.TenguDataInit();
                        ec.showDataModel();
                    }
                    ));
                    //}

                    if (ec.ngObjSize > 0) {
                        ec.showTenguChartII();
                        $(event.target).addClass('active');
                    } else {
                        console.log(`no data obj available`);
                    }
                }
                );

                $('ul').on('click', 'li.ec-usage', (event)=>{
                    ec.setActiveTab(event.target, `${ec.appPath}/usage`);
                    event.preventDefault();
                    //if (document.getElementsByClassName('ec-info').length<1) {                
                    $('.ec-info').remove();
                    $('body').append($('<div class="ec-info"></div>').css({
                        position: "fixed",
                        left: $('body')[0].getBoundingClientRect().width - 100,
                        bottom: 20,
                        color: 'grey'
                    }).text('[ + data@EC ]').on("click", (e)=>{
                        e.preventDefault();
                        ec.TenguDataInit();
                        ec.showDataModel();
                    }
                    ));
                    //}

                    if (ec.ngObjSize > 0) {
                        ec.showTenguChartIII();
                        $(event.target).addClass('active');
                    } else {
                        console.log(`no data obj available`);
                    }
                }
                );

                $('main').on('click', 'a.ec-godoc-rev', (event)=>{
                    event.preventDefault();
                    let p = $(event.target).parents('a')[0]
                      , h = p.href.split("/").pop();
                    ec.setActiveState(event.target.parentNode, ec.appPath + '/godoc/' + h);
                    $("main").html(`<div class="embed-responsive embed-responsive-16by9 mt-3"><iframe class="embed-responsive-item" src="${p.href}" allowfullscreen></iframe></div>`);
                }
                );

                $('ul').on('click', 'li.ec-feature', (event)=>{
                    event.preventDefault();
                    if (ec.featureHTML != "") {
                        ec.setActiveTab(event.target, `${ec.appPath}/features`);
                        $("main").html(ec.featureHTML);
                        return;
                    }

                    let v = ec.getToken('v_tkn')
                      , h = {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${v}`
                        }
                    }
                      , hs = (html)=>{
                        let tmp = document.createElement("DIV");
                        tmp.innerHTML = html;
                        return tmp.textContent || tmp.innerText || "";
                    }
                    ;

                    v && ec.Api('https://ge-dw.aha.io/api/v1/products/DTEC/releases?q=Release%202021', h).then(op=>{
                        return op.releases[1].id;
                    }
                    ).then(rid=>{
                        return ec.Api(`https://ge-dw.aha.io/api/v1/releases/${rid}/features`, h);
                    }
                    ).then(fs=>{
                        let htmlString = `<div class="row justify-content-around"><div class="col-4">`;
                        fs.features.forEach((ft,idx)=>{
                            setTimeout(()=>{
                                ec.Api(`https://ge-dw.aha.io/api/v1/features/${ft.id}`, h).then(f=>{
                                    htmlString += `<div class="card text-white bg-secondary mb-3" style="max-width: 18rem;">` + `<div class="card-header">${f.feature.reference_num}</div>` + `<div class="card-body">` + `<h5 class="card-title">${f.feature.name}</h5>` + `<p class="card-text">${hs(f.feature.description.body).substring(0, 100)} ..</p>` + `</div>` + `</div>`;
                                    if (idx == fs.features.length - 1) {
                                        htmlString += `</div><div class="col-4 ec-feature-col-centre">`;
                                        ec.Api('https://api.github.com/repos/ec-release/oci/issues').then((data)=>{
                                            //let sdArr = Object.values(data);
                                            //data.sort((a, b)=>{
                                            //  return a.number - b.SeqID;
                                            //});
                                            //let htmlString2 = "";
                                            data.forEach((pr,idx)=>{
                                                setTimeout(()=>{
                                                    htmlString += `<div class="card text-white bg-dark mb-3" style="max-width: 18rem;">
									  <div class="card-header">PR#${pr.number}</div>
									  <div class="card-body">
									    <h5 class="card-title">${pr.title}</h5>
									    <p class="card-text">${pr.body.substring(0, 100)} ..</p>
									  </div>
									</div>`
                                                    if (idx == data.length - 1) {
                                                        htmlString += `</div><div class="col-4">`;
                                                        ec.Api(`https://api.github.com/orgs/EC-Release/projects`, {
                                                            method: 'GET',
                                                            headers: {
                                                                Accept: 'application/vnd.github.inertia-preview+json'
                                                            }
                                                        }).then(pl=>{
                                                            pl.forEach((pt,idx)=>{
                                                                htmlString += `<div class="card bg-light mb-3" style="max-width: 18rem;">
												  <div class="card-header">Project#${pt.number}</div>
												  <div class="card-body">
												    <h5 class="card-title">${pt.name}</h5>
												    <p class="card-text">${pt.body.substring(0, 100)} ..</p>
												  </div>
												</div>`
                                                            }
                                                            );
                                                            htmlString += `</div></div>`;
                                                            ec.setActiveTab(event.target, `${ec.appPath}/features`);
                                                            ec.featureHTML = htmlString;
                                                            $("main").html(ec.featureHTML);

                                                        }
                                                        ).catch(e=>{
                                                            console.log(e)
                                                        }
                                                        );
                                                    }
                                                }
                                                , 200);
                                            }
                                            );
                                        }
                                        );

                                    }
                                }
                                ).catch(e=>{
                                    console.log(e)
                                }
                                );
                            }
                            , 200);
                        }
                        );

                    }
                    ).catch(e=>{
                        console.log(e)
                    }
                    );

                }
                );

            }
            ).catch((e)=>{
                console.log(`Exception: ${e}`);
            }
            );

        }
        , (failure)=>{}
        );
    }
    );

}
)();
