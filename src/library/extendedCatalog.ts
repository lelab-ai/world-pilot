export interface ExtendedAsset {id:string;name:string;category:string;description:string;size:readonly[number,number,number];text:string;recipe:string;variant:number;}
export const extendedCatalog:ExtendedAsset[]=[];
export const extendedById=new Map<string,ExtendedAsset>();
