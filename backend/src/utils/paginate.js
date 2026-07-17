export async function paginate(model, args, page = 1, limit = 10) {
    // Convertir en nombres au cas où ce seraient des strings de l'URL
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    
    const skip = (pageNumber - 1) * limitNumber;
  
    // Exécuter la requête pour compter le total + récupérer les données (en parallèle)
    const [total, data] = await Promise.all([
      model.count({ where: args.where }),
      model.findMany({
        ...args,
        skip,
        take: limitNumber,
      }),
    ]);
  
    return {
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }