from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
AUTH = ("", "")

with GraphDatabase.driver(URI, auth=AUTH) as driver:
    with driver.session() as session:
        res = session.run("MATCH (cr:ConnectionRequest) RETURN cr.fromEmployeeId, cr.toEmployeeId, cr.status, cr.relationshipType LIMIT 5")
        for record in res:
            print(record)
        print("Total CR nodes:", session.run("MATCH (cr:ConnectionRequest) RETURN count(cr)").single()[0])
        print("Types:", [type(record["cr.toEmployeeId"]) for record in session.run("MATCH (cr:ConnectionRequest) RETURN cr.toEmployeeId LIMIT 1")])
