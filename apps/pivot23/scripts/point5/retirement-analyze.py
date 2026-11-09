import json,sys,collections,statistics as st
def load(p): return json.load(open(p))
def band(pk): return '<=65' if pk<=65 else '66-74' if pk<=74 else '75-84' if pk<=84 else '85+'
def dist(rows):
  c=collections.Counter(r['end'] for r in rows);n=len(rows)
  return {'n':n,'median':st.median(r['end'] for r in rows),'mean':round(st.mean(r['end'] for r in rows),2),'mode':c.most_common(1)[0][0],'modeShare':round(c.most_common(1)[0][1]/n,3),'le31':round(sum(r['end']<=31 for r in rows)/n,3),'ge35':round(sum(r['end']>=35 for r in rows)/n,3),'at36':round(sum(r['end']==36 for r in rows)/n,3),'hist':{a:round(c[a]/n,3) for a in sorted(c)}}
def report(rows):
  out={'all':dist(rows)}
  for k in ['path','difficulty']:
    out[k]={v:dist([r for r in rows if r[k]==v]) for v in sorted({r[k] for r in rows})}
  out['peakBand']={b:dist([r for r in rows if band(r['peak'])==b]) for b in ['<=65','66-74','75-84','85+'] if any(band(r['peak'])==b for r in rows)}
  out['signal']=dict(collections.Counter(str(r['signal']) for r in rows))
  late=[r for r in rows if r['end']>=35]
  out['ge35EndOvr']={'n':len(late),'median':st.median(r['endOvr'] for r in late) if late else None,'shareEndOvrLt60':round(sum(r['endOvr']<60 for r in late)/len(rows),3)}
  out['at36ByBand']={b:round(sum(r['end']==36 for r in rows if band(r['peak'])==b)/max(1,sum(band(r['peak'])==b for r in rows)),3) for b in ['<=65','66-74','75-84','85+']}
  out['ovr33ge75']={'n':sum(r['ovrAt'].get('33',0)>=75 for r in rows),'ge35':round(st.mean([r['end']>=35 for r in rows if r['ovrAt'].get('33',0)>=75]) if any(r['ovrAt'].get('33',0)>=75 for r in rows) else 0,3)}
  out['endOvrLt60Played35plus']=sum(1 for r in rows if any(int(a)>=35 and o<60 for a,o in r['ovrAt'].items()))
  return out
if __name__=='__main__':
  print(json.dumps({p:report(load(p)) for p in sys.argv[1:]},indent=1))
