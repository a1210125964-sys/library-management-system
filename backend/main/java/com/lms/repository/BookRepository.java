package com.lms.repository;

import com.lms.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
    boolean existsByIsbn(String isbn);
    long countByCategory(String category);

    @Query("select coalesce(sum(b.stock), 0), coalesce(sum(b.availableStock), 0) from Book b")
    List<Object[]> sumStockAndAvailableStock();

    @Modifying
    @Query("update Book b set b.category = :newName where b.category = :oldName")
    int renameCategory(@Param("oldName") String oldName, @Param("newName") String newName);

    @Modifying
    @Query("update Book b set b.availableStock = b.availableStock - 1, b.updatedAt = CURRENT_TIMESTAMP where b.id = :bookId and b.availableStock > 0")
    int decreaseAvailableStockIfEnough(@Param("bookId") Long bookId);

    @Modifying
    @Query("update Book b set b.availableStock = b.availableStock + 1, b.updatedAt = CURRENT_TIMESTAMP where b.id = :bookId and b.availableStock < b.stock")
    int increaseAvailableStock(@Param("bookId") Long bookId);

    List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrIsbnContainingIgnoreCaseOrCategoryContainingIgnoreCase(
        String title, String author, String isbn, String category
    );

    Page<Book> findAll(Pageable pageable);

    Page<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrIsbnContainingIgnoreCaseOrCategoryContainingIgnoreCase(
        String title,
        String author,
        String isbn,
        String category,
        Pageable pageable
    );

    List<Book> findByActiveTrue();

    Page<Book> findByActiveTrue(Pageable pageable);

    @Query("select b from Book b where b.active = true and (lower(b.title) like lower(concat('%', :keyword, '%')) or lower(b.author) like lower(concat('%', :keyword, '%')) or lower(b.isbn) like lower(concat('%', :keyword, '%')) or lower(b.category) like lower(concat('%', :keyword, '%')))")
    Page<Book> findByActiveTrueAndKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("select b from Book b where b.active = true and (lower(b.title) like lower(concat('%', :keyword, '%')) or lower(b.author) like lower(concat('%', :keyword, '%')) or lower(b.isbn) like lower(concat('%', :keyword, '%')) or lower(b.category) like lower(concat('%', :keyword, '%')))")
    List<Book> findByActiveTrueAndKeyword(@Param("keyword") String keyword);
}
