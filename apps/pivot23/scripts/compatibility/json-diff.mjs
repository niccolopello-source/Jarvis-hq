export function firstDiff(a,b,path="$") {
 if (Object.is(a,b)) return null;
 if (a===null || b===null || typeof a!=="object" || typeof b!=="object") return path;
 if(Array.isArray(a)!==Array.isArray(b))return path;
 const keys=[...new Set([...Object.keys(a),...Object.keys(b)])];
 for(const key of keys) { if(!Object.hasOwn(a,key)||!Object.hasOwn(b,key))return `${path}.${key}`; const d=firstDiff(a[key],b[key],`${path}.${key}`);if(d)return d; }
 return null;
}
