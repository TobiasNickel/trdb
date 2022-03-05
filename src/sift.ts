// import sift, { Query } from 'sift';

// type TmpClass = Query<{
//   name: string;
//   address:{
//     street: string;
//   }
// }>;

// var tmp: TmpClass = {
//   name:  { $in: ['test'] },
//   address: {
//     street: { $in: ['mainstreet'] }
//   }
// };

// sift<TmpClass>({
//   name:  { $in: ['test'] },
//   address: {
//     street: { $in: ['mainstreet'] }
//   }
// });

// console.log(
//   'testSift:', 
//   [{address:{street:'mainStreet'}}]
//     .filter(sift({address:{street: 'mainStreet' }}))
// )
