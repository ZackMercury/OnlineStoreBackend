
/** Populating the category tree using the category array (Mutable!) 
 * @param obj The object to populate
 * @param category The category array to populate the obj
*/
export const populateCategoryTree = (obj: any, category: string[]) => {
    category.forEach((sub) => {
        if(!obj[sub])
            obj[sub] = {};
        obj = obj[sub];
    })
};