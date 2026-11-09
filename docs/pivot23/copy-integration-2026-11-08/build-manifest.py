import subprocess,json,hashlib,datetime,re,shutil
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image
repo=Path('/workspace/pivot23-ui-integration');ev=Path('/workspace/point3-evidence')
def git(*args):return subprocess.check_output(['git',*args],cwd=repo).decode().strip()
def h(b):return hashlib.sha256(b).hexdigest()
runtime='b1eeed1f59715f5809f087d6e666e95ec2da7e79'
old=json.loads((repo/'docs/pivot23/ui-review156-2026-11-07/protected-source-check.json').read_text())
protected={}
for name,expected in old['protectedFiles'].items():
 current=h((repo/name).read_bytes());protected[name]={'baselineSha256':expected,'currentSha256':current,'identical':expected==current}
source={}
for p in sorted((repo/'apps/pivot23/src').rglob('*')):
 if p.is_file():source[str(p.relative_to(repo))]=h(p.read_bytes())
for name in ['apps/pivot23/package.json','apps/pivot23/e2e/copy-context.spec.ts','apps/pivot23/e2e/fixtures/make-copy-save.ts','apps/pivot23/e2e/ui-guard-integration.spec.ts','tools/pivot23-copy-review.ts']:
 source[name]=h((repo/name).read_bytes())
images={}
for folder in ['screenshots-b1ee','ui-screenshots-b1ee']:
 for p in sorted((ev/folder).rglob('*.png')):
  if p.stat().st_mtime < (ev/'build-b1ee.log').stat().st_mtime: continue
  dest=ev/'final-b1ee'/folder/p.name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
  images[str(dest.relative_to(ev))]={'sha256':h(dest.read_bytes()),'dimensions':list(Image.open(dest).size),'runtime':runtime}
logs={}
for p in sorted(ev.glob('*.log')):
 logs[p.name]={'sha256':h(p.read_bytes()),'bytes':p.stat().st_size}
dist={str(p.relative_to(repo/'apps/pivot23/dist')):h(p.read_bytes()) for p in sorted((repo/'apps/pivot23/dist').rglob('*')) if p.is_file()}
manifest={'observedAt':datetime.datetime.now(ZoneInfo('Europe/Rome')).isoformat(),'runtime':runtime,'runtimeAppTree':git('rev-parse',runtime+':apps/pivot23'),'workingRuntimeSourceMatchesRuntime':git('diff',runtime,'--','apps/pivot23/src','apps/pivot23/package.json','tools/pivot23-copy-review.ts')=='','baseline155':old['baseline'],'protectedCount':len(protected),'identicalCount':sum(x['identical'] for x in protected.values()),'justifiedPresentationExceptions':[name for name,x in protected.items() if not x['identical']],'protected':protected,'source':source,'dist':dist,'images':images,'logs':logs,'copyCorpus':{'file':'copy-samples-b1ee.json','sha256':h((ev/'copy-samples-b1ee.json').read_bytes()),'seeds':[777001,777002,777003,7107,89081]},'previousFullE2ERuntime':'5150d1e04b4814859258e9c15a4fa78a406b9f33','fullSuiteBeforeLastVisualFix':'6591c9337b5f67e4c2bdf712af768d1668b09933','finalAffectedE2ERuntime':runtime,'testedHarnessCommit':git('rev-parse','HEAD'),'fullSuiteBeforeVisualFixCopyHarnessSha256':h(subprocess.check_output(['git','show','6591c9337b5f67e4c2bdf712af768d1668b09933:apps/pivot23/e2e/copy-context.spec.ts'],cwd=repo)),'limitations':['no universal gameplay or language claim','89081 historical resume RNG issue OPEN','no real saves','no Safari Firefox devices or old tabs certification']}
(ev/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['observedAt','runtime','workingRuntimeSourceMatchesRuntime','protectedCount','identicalCount','justifiedPresentationExceptions']},indent=2));print('images',len(images),'source',len(source),'dist',len(dist))
