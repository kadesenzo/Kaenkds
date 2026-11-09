import { Client, Vehicle } from "../../types";

// 100% Real Workshop Data synchronized from Firebase Firestore
export const DEFAULT_CLIENTS: Client[] = [
  {
    "id": "2pe8t4ead",
    "name": "MAYCON",
    "phone": "13998032592",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-06T18:37:07.530Z"
  },
  {
    "id": "6mph25bw5",
    "name": "THELES",
    "phone": "119000000000",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-12T21:54:41.705Z"
  },
  {
    "id": "k0r0bwixo",
    "name": "ANDRÉ",
    "phone": "13997749638",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-15T20:30:27.064Z"
  },
  {
    "id": "fr71jp0ry",
    "name": "LISMAR",
    "phone": "13974167370",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-16T20:37:27.890Z"
  },
  {
    "id": "0taoa8w4s",
    "name": "JOEL",
    "phone": "13997402832",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-19T02:23:23.684Z"
  },
  {
    "id": "b54nq2t1n",
    "name": "LARISSA/LAERCIO",
    "phone": "1399999999",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-19T16:10:27.160Z"
  },
  {
    "id": "2o3838g7q",
    "name": "LARISSA/LAERCIO",
    "phone": "1399999999",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-19T16:12:55.805Z"
  },
  {
    "id": "qf8ne7gu0",
    "name": "DAVI FLORENCIO",
    "phone": "13997309794",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-19T19:57:11.591Z"
  },
  {
    "id": "ipvqt6c0z",
    "name": "DAVI FLORENCIO",
    "phone": "13999999999",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-19T20:00:07.926Z"
  },
  {
    "id": "jub3iwlsa",
    "name": "MIZAEL",
    "phone": "13999999999",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-22T20:09:26.776Z"
  },
  {
    "id": "xxmfw66u7",
    "name": "GERSON  VEREADOR",
    "phone": "13996309545",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-23T00:44:12.865Z"
  },
  {
    "id": "9tz61cfkz",
    "name": "CEZAR SABESP",
    "phone": "13996423764",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-23T14:39:53.029Z"
  },
  {
    "id": "qs3qvogns",
    "name": "JUNIOR/CATERINE",
    "phone": "13998074416",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-23T17:49:47.361Z"
  },
  {
    "id": "g4n4fmx0w",
    "name": "ORLANDO",
    "phone": "13996139550",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-09-25T19:13:07.358Z"
  },
  {
    "id": "bis6f3axx",
    "name": "EDSON",
    "phone": "13999999999",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-26T11:36:06.754Z"
  },
  {
    "id": "4au0wdhio",
    "name": "LEONARDO",
    "phone": "13996192105",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-26T14:30:24.486Z"
  },
  {
    "id": "qafyzo1d5",
    "name": "JOAO",
    "phone": "13999999999",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-27T18:44:37.396Z"
  },
  {
    "id": "6518io0x7",
    "name": "ANTIUK",
    "phone": "13996184262",
    "document": "---",
    "observations": "",
    "createdAt": "2026-09-28T14:43:26.251Z"
  },
  {
    "id": "nvshupzjc",
    "name": "LADINHO VEICULOS",
    "phone": "13997158206",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-02T17:11:16.727Z"
  },
  {
    "id": "wmig15rda",
    "name": "RODRIGO/KARINA",
    "phone": "13997073234",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-03T11:51:29.655Z"
  },
  {
    "id": "xql90a0c4",
    "name": "ELIAS",
    "phone": "13997310563",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-10-03T14:58:26.529Z"
  },
  {
    "id": "lpsialh3s",
    "name": "LEANDRO RAMOS",
    "phone": "18981095187",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-05T22:14:06.825Z"
  },
  {
    "id": "860dyt46h",
    "name": "AMIL",
    "phone": "13997689356",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-08T11:39:37.791Z"
  },
  {
    "id": "83eqq3i1i",
    "name": "DEISE",
    "phone": "997646751",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-08T13:21:24.138Z"
  },
  {
    "id": "2t9h0c10a",
    "name": "FLAVIO",
    "phone": "31999140384",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-09T22:03:12.167Z"
  },
  {
    "id": "hqckef8lm",
    "name": "JESUS  /MARILZA",
    "phone": "13996402987",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-10T11:26:58.039Z"
  },
  {
    "id": "pn4cvjyy4",
    "name": "DOUTOR EDSON",
    "phone": "+55 13 99766-1849",
    "document": "---",
    "observations": "CADASTRADO VIA NOTA",
    "createdAt": "2026-10-12T20:07:46.893Z"
  },
  {
    "id": "4axoczhjv",
    "name": "LADINHO",
    "phone": "13997158206",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-13T18:54:56.493Z"
  },
  {
    "id": "up4tstm0u",
    "name": "NEI",
    "phone": "13997851480",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-14T00:37:32.446Z"
  },
  {
    "id": "2tlrq98qx",
    "name": "MAURICI",
    "phone": "997967712",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-14T19:06:32.454Z"
  },
  {
    "id": "ayc3ljurt",
    "name": "GILBERTO ONIX",
    "phone": "13997928659",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-14T20:00:44.314Z"
  },
  {
    "id": "qt8x0iwu8",
    "name": "JUNIOR /CATERINE",
    "phone": "13998074416",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-15T14:50:33.377Z"
  },
  {
    "id": "2pblp7jbc",
    "name": "PATRIK",
    "phone": "13996112430",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-15T19:29:50.937Z"
  },
  {
    "id": "tiiqr5yhz",
    "name": "GERSON VEREADOR",
    "phone": "13996309545",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-16T12:39:31.658Z"
  },
  {
    "id": "u9uhgdf5d",
    "name": "RODRIGO",
    "phone": "13996601859",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-16T20:05:43.443Z"
  },
  {
    "id": "5z49k5pma",
    "name": "ROBERTO PROFESSOR TENNIS",
    "phone": "13997281425",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-17T15:07:36.331Z"
  },
  {
    "id": "9es7n9zr2",
    "name": "FELIPE KAEN",
    "phone": "13997960975",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-17T21:22:32.816Z"
  },
  {
    "id": "ckxl6zonr",
    "name": "ERIK",
    "phone": "13997191437",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-17T21:46:08.981Z"
  },
  {
    "id": "yeu7znhvd",
    "name": "ROBERIO",
    "phone": "4192370119",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-20T19:08:23.530Z"
  },
  {
    "id": "3rhdqkb6e",
    "name": "ALANA ACUPUNTURA",
    "phone": "13999999999",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-22T19:45:01.793Z"
  },
  {
    "id": "w2hlubkbn",
    "name": "ANDRÉ",
    "phone": "13997263016",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-22T20:03:19.370Z"
  },
  {
    "id": "11kz64iu3",
    "name": "OSIEL",
    "phone": "13997975429",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-22T22:53:27.724Z"
  },
  {
    "id": "z7wuzmks6",
    "name": "OSIEL",
    "phone": "13997975429",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-23T12:51:23.238Z"
  },
  {
    "id": "vubgm0ikc",
    "name": "MARÇAL",
    "phone": "13996176365",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-23T12:57:13.403Z"
  },
  {
    "id": "4h2sj7h4a",
    "name": "VANDER LOPES",
    "phone": "13996883490",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-23T14:10:59.916Z"
  },
  {
    "id": "ehap9aeph",
    "name": "SANDRO NIHON",
    "phone": "13998078039",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-23T17:57:51.833Z"
  },
  {
    "id": "e7kj594fo",
    "name": "JOÃO /FLAVIA",
    "phone": "13997927566",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-23T18:16:15.171Z"
  },
  {
    "id": "vawz5kgmn",
    "name": "RODRIGO LUZ",
    "phone": "13996912373",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-24T21:06:10.639Z"
  },
  {
    "id": "jsu2y1k0q",
    "name": "HELIO DE JESUS ALVES",
    "phone": "13997083650",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-26T20:10:14.841Z"
  },
  {
    "id": "m8053qopf",
    "name": "SANDRO NUNES DE OLIVEIRA",
    "phone": "13996558209",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-26T20:48:56.721Z"
  },
  {
    "id": "n8p35dkne",
    "name": "CLAUDIO PERNAMBUCO",
    "phone": "13996248062",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-27T20:17:24.492Z"
  },
  {
    "id": "8du8ioj2f",
    "name": "REGINALDO CAMARA",
    "phone": "13997788433",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-28T13:08:56.245Z"
  },
  {
    "id": "75i8cz4jc",
    "name": "SALATIAO",
    "phone": "13982297151",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-29T21:11:03.690Z"
  },
  {
    "id": "n2vd1vxu8",
    "name": "BRUNO / BRADESCO",
    "phone": "13997236591",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-30T16:53:28.030Z"
  },
  {
    "id": "3k6h8pd07",
    "name": "CLAUDIO DE SOUSA RAMOS",
    "phone": "13981481809",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-30T19:57:20.372Z"
  },
  {
    "id": "iol0od4de",
    "name": "JESUS /MARILZA",
    "phone": "13996402987",
    "document": "---",
    "observations": "",
    "createdAt": "2026-10-30T20:49:28.675Z"
  },
  {
    "id": "a1qfa9tpr",
    "name": "ANTÔNIO BRÁS",
    "phone": "13997919064",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-04T12:44:23.478Z"
  },
  {
    "id": "w5cmimtbn",
    "name": "REINALDO /STRADA",
    "phone": "13997577664",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-05T11:52:50.785Z"
  },
  {
    "id": "do1pboohb",
    "name": "GABRIELA /LUIZ",
    "phone": "13996088838",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-05T12:42:18.864Z"
  },
  {
    "id": "04fwhts0l",
    "name": "ANTONY",
    "phone": "13981014839",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-05T21:44:48.135Z"
  },
  {
    "id": "jy6t9s9h7",
    "name": "WELLINGTON/ERICA",
    "phone": "11998979373",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-06T17:15:44.505Z"
  },
  {
    "id": "x6iv340jp",
    "name": "WELINGTON/ERICA",
    "phone": "11998979373",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-06T17:18:28.311Z"
  },
  {
    "id": "lhy4u3ryv",
    "name": "DALVINA",
    "phone": "13996704614",
    "document": "---",
    "observations": "",
    "createdAt": "2026-11-07T16:32:47.425Z"
  }
];

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    "id": "oc3pfy85q",
    "clientId": "2pe8t4ead",
    "plate": "FFW6E03",
    "model": "SAVEIRO 1.6 16 V",
    "brand": "---",
    "year": "---",
    "km": 201
  },
  {
    "id": "jz57vc17e",
    "clientId": "6mph25bw5",
    "plate": "ALF7344",
    "model": "CRUZE",
    "brand": "---",
    "year": "---",
    "km": 112
  },
  {
    "id": "zfshmj6u3",
    "clientId": "k0r0bwixo",
    "plate": "ERG0G96",
    "model": "HB20 1.6 16V",
    "brand": "HIUNDAY",
    "year": "2014",
    "km": 147.952
  },
  {
    "id": "frr0cttwc",
    "clientId": "fr71jp0ry",
    "plate": "LVO7H40",
    "model": "CLIO 1.0 8VALV.",
    "brand": "RENAUT",
    "year": "2002",
    "km": 233.688
  },
  {
    "id": "81584qxbq",
    "clientId": "0taoa8w4s",
    "plate": "DSER44",
    "model": "MERIVA 1.8 2007",
    "brand": "---",
    "year": "---",
    "km": 0
  },
  {
    "id": "i9898u53e",
    "clientId": "2o3838g7q",
    "plate": "FYR0G88",
    "model": "NOVO PALIO",
    "brand": "FIAT",
    "year": "2015",
    "km": 104.2
  },
  {
    "id": "1zan1m9zi",
    "clientId": "ipvqt6c0z",
    "plate": "QUD4D78",
    "model": "STEADA",
    "brand": "FIAT",
    "year": "2020",
    "km": 158.584
  },
  {
    "id": "cf8blvaz9",
    "clientId": "xxmfw66u7",
    "plate": "ETH4G96",
    "model": "UNO FIRE",
    "brand": "FIAT",
    "year": "2012",
    "km": 219.652
  },
  {
    "id": "7wz4vtr4i",
    "clientId": "9tz61cfkz",
    "plate": "FFR2B64",
    "model": "PRISMA",
    "brand": "CHEVROLET",
    "year": "2013",
    "km": 216.086
  },
  {
    "id": "p1wm1mew5",
    "clientId": "qs3qvogns",
    "plate": "FYB3E48",
    "model": "TORO",
    "brand": "FIAT",
    "year": "2022",
    "km": 107.592
  },
  {
    "id": "vi9n39577",
    "clientId": "bis6f3axx",
    "plate": "DUR3D02",
    "model": "CLASSIC",
    "brand": "GM",
    "year": "2008",
    "km": 112.663
  },
  {
    "id": "5hfzo2tw9",
    "clientId": "4au0wdhio",
    "plate": "FLP1670",
    "model": "NEW FIESTA",
    "brand": "FORD",
    "year": "2015",
    "km": 72.219
  },
  {
    "id": "wy8ekyrgo",
    "clientId": "qafyzo1d5",
    "plate": "9999999",
    "model": "VW",
    "brand": "GERAL",
    "year": "---",
    "km": 0
  },
  {
    "id": "srvu0kode",
    "clientId": "6518io0x7",
    "plate": "EKY0F96",
    "model": "FOX",
    "brand": "VW",
    "year": "2010",
    "km": 146.603
  },
  {
    "id": "u9prcy3ub",
    "clientId": "nvshupzjc",
    "plate": "EEL4B90",
    "model": "ECOSPORT",
    "brand": "FORD",
    "year": "2022",
    "km": 95000
  },
  {
    "id": "xmxobqh53",
    "clientId": "nvshupzjc",
    "plate": "EEL4B90",
    "model": "NEW ECOSPORT",
    "brand": "---",
    "year": "---",
    "km": 90000
  },
  {
    "id": "nniu8hgay",
    "clientId": "wmig15rda",
    "plate": "DNQ5071",
    "model": "STILO",
    "brand": "FIAT",
    "year": "2006",
    "km": 290.068
  },
  {
    "id": "8y83jy3ix",
    "clientId": "xql90a0c4",
    "plate": "FR01I59",
    "model": "GRAND SIENA",
    "brand": "---",
    "year": "---",
    "km": 159
  },
  {
    "id": "5tvk7de9m",
    "clientId": "lpsialh3s",
    "plate": "FW03B24",
    "model": "KA+",
    "brand": "FORD",
    "year": "2015",
    "km": 169.633
  },
  {
    "id": "3jkv0yf1d",
    "clientId": "860dyt46h",
    "plate": "FQC6399",
    "model": "PRISMA",
    "brand": "GM",
    "year": "2015",
    "km": 106.737
  },
  {
    "id": "p7bxelxdl",
    "clientId": "83eqq3i1i",
    "plate": "EAK4D01",
    "model": "LOGAN",
    "brand": "RENAUT",
    "year": "2008",
    "km": 211.409
  },
  {
    "id": "glga6031p",
    "clientId": "2t9h0c10a",
    "plate": "DMW9B60",
    "model": "CORSAO",
    "brand": "GM",
    "year": "2004",
    "km": 249.136
  },
  {
    "id": "h93dnz5cs",
    "clientId": "hqckef8lm",
    "plate": "FWG1A84",
    "model": "UP",
    "brand": "VW",
    "year": "2016",
    "km": 157.268
  },
  {
    "id": "ci2ztixuc",
    "clientId": "pn4cvjyy4",
    "plate": "DKW3899",
    "model": "AUDI A3 2005",
    "brand": "---",
    "year": "---",
    "km": 217029
  },
  {
    "id": "e326h6a8z",
    "clientId": "4axoczhjv",
    "plate": "FUC4F25",
    "model": "STRADA",
    "brand": "FIAT",
    "year": "2015",
    "km": 266.504
  },
  {
    "id": "4pi998pif",
    "clientId": "nvshupzjc",
    "plate": "FUC4F25",
    "model": "SRRADA",
    "brand": "---",
    "year": "---",
    "km": 266
  },
  {
    "id": "0ay56kqjj",
    "clientId": "up4tstm0u",
    "plate": "ETT1689",
    "model": "207",
    "brand": "PEGEOUT",
    "year": "2012",
    "km": 66.768
  },
  {
    "id": "uphyoa97x",
    "clientId": "2tlrq98qx",
    "plate": "DXS9E23",
    "model": "SIENA",
    "brand": "FIAT",
    "year": "2008",
    "km": 246.26
  },
  {
    "id": "mihz8f979",
    "clientId": "ayc3ljurt",
    "plate": "FLJ2A30",
    "model": "ONIX",
    "brand": "GM",
    "year": "2913",
    "km": 193.746
  },
  {
    "id": "6f8s58nj0",
    "clientId": "qt8x0iwu8",
    "plate": "FYB3E48",
    "model": "TORO",
    "brand": "FIAT",
    "year": "2021",
    "km": 108.862
  },
  {
    "id": "8z0v74bpg",
    "clientId": "up4tstm0u",
    "plate": "FSC5557",
    "model": "FIT",
    "brand": "GERAL",
    "year": "2015",
    "km": 160.044
  },
  {
    "id": "7pwuvxvxo",
    "clientId": "2pblp7jbc",
    "plate": "BAQ0E16",
    "model": "ETIOS",
    "brand": "GERAL",
    "year": "2017",
    "km": 225.929
  },
  {
    "id": "64mvbx2qp",
    "clientId": "tiiqr5yhz",
    "plate": "DMD9H47",
    "model": "ZAFIRA",
    "brand": "GM",
    "year": "2007",
    "km": 298.787
  },
  {
    "id": "t45hhex3p",
    "clientId": "xxmfw66u7",
    "plate": "DMD9H47",
    "model": "ZAFIRA",
    "brand": "GM",
    "year": "2007",
    "km": 298.787
  },
  {
    "id": "h491k9bvc",
    "clientId": "u9uhgdf5d",
    "plate": "MBP9008",
    "model": "CORSA",
    "brand": "GM",
    "year": "2001",
    "km": 150
  },
  {
    "id": "i0eeh2ro9",
    "clientId": "5z49k5pma",
    "plate": "ORE8A83",
    "model": "HRV",
    "brand": "HONDA",
    "year": "2016",
    "km": 101.409
  },
  {
    "id": "u5wfm6ht5",
    "clientId": "9es7n9zr2",
    "plate": "EEE7731",
    "model": "PALIO",
    "brand": "FIAT",
    "year": "2007",
    "km": 100
  },
  {
    "id": "lcavd5i5z",
    "clientId": "ckxl6zonr",
    "plate": "AXK1H03",
    "model": "PRISMA",
    "brand": "GM",
    "year": "2012",
    "km": 222.7
  },
  {
    "id": "yiq8zeeup",
    "clientId": "yeu7znhvd",
    "plate": "FDJ7H21",
    "model": "STRADA",
    "brand": "FIAT",
    "year": "2012",
    "km": 485.31
  },
  {
    "id": "ioqquezss",
    "clientId": "3rhdqkb6e",
    "plate": "GCK7088",
    "model": "FOX",
    "brand": "VW",
    "year": "2017",
    "km": 226.368
  },
  {
    "id": "p4u1dcb4k",
    "clientId": "w2hlubkbn",
    "plate": "DZZ6108",
    "model": "CORSA",
    "brand": "GM",
    "year": "2009",
    "km": 276.695
  },
  {
    "id": "srdv1kuog",
    "clientId": "11kz64iu3",
    "plate": "ETT1265",
    "model": "MERIVA",
    "brand": "GM",
    "year": "2011",
    "km": 85
  },
  {
    "id": "ktxthldtw",
    "clientId": "z7wuzmks6",
    "plate": "ETT1265",
    "model": "MERIVA",
    "brand": "GM",
    "year": "2011",
    "km": 93
  },
  {
    "id": "kt7iuu009",
    "clientId": "vubgm0ikc",
    "plate": "GJX3G00",
    "model": "DUSTER",
    "brand": "RENAUT",
    "year": "2016",
    "km": 134.121
  },
  {
    "id": "rhgdokkhv",
    "clientId": "4h2sj7h4a",
    "plate": "EDN2111",
    "model": "CORSAO",
    "brand": "GM",
    "year": "2008",
    "km": 182.869
  },
  {
    "id": "0b1zsjv3f",
    "clientId": "ehap9aeph",
    "plate": "FFF2222",
    "model": "SPIN",
    "brand": "GM",
    "year": "2021",
    "km": 85
  },
  {
    "id": "t6s87xvup",
    "clientId": "e7kj594fo",
    "plate": "EXI5D66",
    "model": "GOL G4",
    "brand": "VW",
    "year": "2012",
    "km": 193.004
  },
  {
    "id": "ol2p3r4wu",
    "clientId": "vawz5kgmn",
    "plate": "EYX6002",
    "model": "NEW FIESTA",
    "brand": "FORD",
    "year": "2012",
    "km": 193.417
  },
  {
    "id": "dqxk8d7g5",
    "clientId": "jsu2y1k0q",
    "plate": "PZZ1C62",
    "model": "SAVEIRO",
    "brand": "VW",
    "year": "2017",
    "km": 135.947
  },
  {
    "id": "tmanwf5en",
    "clientId": "m8053qopf",
    "plate": "DSD1308",
    "model": "CELTA",
    "brand": "GM",
    "year": "2006",
    "km": 258.446
  },
  {
    "id": "1jcp8v7de",
    "clientId": "n8p35dkne",
    "plate": "FTK3490",
    "model": "C3",
    "brand": "CITROEN",
    "year": "2016",
    "km": 211.607
  },
  {
    "id": "aolowjqnc",
    "clientId": "8du8ioj2f",
    "plate": "FOS3D45",
    "model": "ONIX",
    "brand": "GM",
    "year": "2019",
    "km": 11.578
  },
  {
    "id": "uipqvfqs9",
    "clientId": "3rhdqkb6e",
    "plate": "GCK7088",
    "model": "FOX",
    "brand": "---",
    "year": "---",
    "km": 226
  },
  {
    "id": "tiepzkus6",
    "clientId": "4h2sj7h4a",
    "plate": "GCR8G72",
    "model": "VIRTUS",
    "brand": "VW",
    "year": "2022",
    "km": 161.595
  },
  {
    "id": "mzzygd0zv",
    "clientId": "75i8cz4jc",
    "plate": "COI8327",
    "model": "GOL G2",
    "brand": "VW",
    "year": "97",
    "km": 352.645
  },
  {
    "id": "q68cbqk7y",
    "clientId": "n2vd1vxu8",
    "plate": "GJL5F78",
    "model": "ONIX TURBO",
    "brand": "GM",
    "year": "2023",
    "km": 86.019
  },
  {
    "id": "8inqghz8s",
    "clientId": "3k6h8pd07",
    "plate": "BZK4B57",
    "model": "UP TSI",
    "brand": "VW",
    "year": "2019",
    "km": 114.636
  },
  {
    "id": "7x1tlsqx4",
    "clientId": "iol0od4de",
    "plate": "FWG1A84",
    "model": "UP",
    "brand": "VW",
    "year": "2015",
    "km": 157.918
  },
  {
    "id": "paj9hzep7",
    "clientId": "a1qfa9tpr",
    "plate": "DXW6G88",
    "model": "COROLLA",
    "brand": "GERAL",
    "year": "2009",
    "km": 247.834
  },
  {
    "id": "ejfqi1qmd",
    "clientId": "w5cmimtbn",
    "plate": "EZW7H26",
    "model": "STTADA",
    "brand": "FIAT",
    "year": "2014",
    "km": 145.334
  },
  {
    "id": "3c4oq4khj",
    "clientId": "do1pboohb",
    "plate": "FJB6E98",
    "model": "UP",
    "brand": "VW",
    "year": "2015",
    "km": 231.17
  },
  {
    "id": "4e480fu0g",
    "clientId": "04fwhts0l",
    "plate": "AUA4D12",
    "model": "JETTA",
    "brand": "VW",
    "year": "2011",
    "km": 172.325
  },
  {
    "id": "nmqkpnrbm",
    "clientId": "jy6t9s9h7",
    "plate": "FDS9J88",
    "model": "SANTA FÉ",
    "brand": "HIUNDAY",
    "year": "2011",
    "km": 159.644
  },
  {
    "id": "tsnnuvfh5",
    "clientId": "x6iv340jp",
    "plate": "FDS9J88",
    "model": "SANTA FÉ",
    "brand": "HIUNDAY",
    "year": "2011",
    "km": 159.644
  },
  {
    "id": "2piu7zkxh",
    "clientId": "lhy4u3ryv",
    "plate": "HYV7H55",
    "model": "GOL G5",
    "brand": "VW",
    "year": "2010",
    "km": 159.516
  }
];
