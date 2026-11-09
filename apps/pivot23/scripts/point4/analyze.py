"""Summarize paired synthetic diagnostics, without significance/population claims."""
import json,sys,statistics as st
from pathlib import Path
root=Path(sys.argv[1]); rows=json.loads((root/'careers.json').read_text()); sens=json.loads((root/'sensitivity.json').read_text())
def summary(xs):
 xs=sorted(xs)
 def q(p):
  x=p*(len(xs)-1);lo=int(x);hi=min(lo+1,len(xs)-1);return xs[lo]+(xs[hi]-xs[lo])*(x-lo)
 return dict(n=len(xs),mean=st.mean(xs),median=st.median(xs),p10=q(.1),p90=q(.9),min=min(xs),max=max(xs))
by={(r['seed'],r['profile']):r for r in rows}
profiles={p:{'peak':summary([r['peak'] for r in rows if r['profile']==p]),'retirement':summary([r['retirement'] for r in rows if r['profile']==p]),'royRate':st.mean(r['roy'] for r in rows if r['profile']==p),'mvpRate':st.mean(r['mvp']>0 for r in rows if r['profile']==p)}for p in sorted(set(r['profile']for r in rows))}
pairs={}
for a,b in [('best','worst'),('morale-up','morale-down'),('high-initial-morale','low-initial-morale')]:
 key=a+' minus '+b
 pairs[key]={'overall':summary([r['peak']-by[r['seed'],b]['peak']for r in rows if r['profile']==a]),'byDifficulty':{d:summary([r['peak']-by[r['seed'],b]['peak']for r in rows if r['profile']==a and r['difficulty']==d])for d in ['esordio','pro','allstar','leggenda']},'byPath':{d:summary([r['peak']-by[r['seed'],b]['peak']for r in rows if r['profile']==a and r['path']==d])for d in ['NCAA','Europa','G-League']}}
sb={(r['seed'],r['morale']):r for r in sens}
controlled={metric:summary([r[metric]-sb[r['seed'],10][metric]for r in sens if r['morale']==100])for metric in ['min','ppg','overall','gp']}
assert all(r['startRng']==sb[r['seed'],10]['startRng']for r in sens)
controlled['sameEndRngPairs']=sum(r['endRng']==sb[r['seed'],10]['endRng']for r in sens if r['morale']==100)
growth={}
for a in [24,25,26,27]:
 vals=[];apex={}
 for r in rows:
  if r['profile']!='random':continue
  h={v['age']:v['ovr']for v in r['seasons']}
  if a in h and a+1 in h:
   delta=h[a+1]-h[a];vals.append(delta);apex.setdefault(str(r['apex']),[]).append(delta)
 growth[f'{a}→{a+1}']={'overall':summary(vals),'byApex':{k:summary(v)for k,v in apex.items()}}
out=dict(profiles=profiles,pairs=pairs,controlledMorale100Minus10=controlled,randomProfileAgeDeltas=growth,limits='120 matched seed-profiles; 2 replicas per role/path/difficulty. Population estimates or universal identical behavior NOT claimed. Single-season control isolates input morale; career policy trajectories may diverge. No runtime coefficients changed.')
(root/'summary.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
