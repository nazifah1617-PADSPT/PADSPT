
export enum Category {
  MASJID = 'MASJID',
  SURAU = 'SURAU',
  PEGAWAI = 'PEGAWAI'
}

export interface MosqueInfo {
  id: string;
  namaMasjid: string;
  noPendaftaran: string;
  noAkaun: string;
}

export interface CommitteeMember {
  id: string;
  jenis: Category;
  nama: string;
  nokp: string;
  tempat: string;
  kariah?: string;
  jawatan: string;
  parlimen: string;
  dun: string;
  jantina: 'LELAKI' | 'PEREMPUAN';
  umur: string;
  notel: string;
  pekerjaan: string;
  tarikhLantikan: string;
  tarikhTamat: string;
  alamat: string;
  noPendaftaran?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'user' | 'superadmin';
}

export type ViewMode = 'PUBLIC' | 'ADMIN';
