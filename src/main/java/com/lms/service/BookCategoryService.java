package com.lms.service;

import com.lms.exception.BusinessException;
import com.lms.model.BookCategory;
import com.lms.repository.BookCategoryRepository;
import com.lms.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookCategoryService {

    private final BookCategoryRepository bookCategoryRepository;
    private final BookRepository bookRepository;

    public BookCategoryService(BookCategoryRepository bookCategoryRepository, BookRepository bookRepository) {
        this.bookCategoryRepository = bookCategoryRepository;
        this.bookRepository = bookRepository;
    }

    public List<BookCategory> list() {
        return bookCategoryRepository.findAllByOrderByNameAsc();
    }

    @Transactional
    public BookCategory create(String name, String description) {
        String normalizedName = normalize(name);
        if (bookCategoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new BusinessException("分类已存在");
        }
        BookCategory category = new BookCategory();
        category.setName(normalizedName);
        category.setDescription(description == null ? "" : description.trim());
        category.setCreatedAt(LocalDateTime.now());
        return bookCategoryRepository.save(category);
    }

    @Transactional
    public BookCategory update(Long id, String name, String description) {
        BookCategory category = bookCategoryRepository.findById(id)
            .orElseThrow(() -> new BusinessException("分类不存在"));

        String normalizedName = normalize(name);
        if (!category.getName().equalsIgnoreCase(normalizedName) && bookCategoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new BusinessException("分类已存在");
        }

        String oldName = category.getName();
        category.setName(normalizedName);
        category.setDescription(description == null ? "" : description.trim());
        BookCategory saved = bookCategoryRepository.save(category);

        if (!oldName.equals(normalizedName)) {
            bookRepository.renameCategory(oldName, normalizedName);
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        BookCategory category = bookCategoryRepository.findById(id)
            .orElseThrow(() -> new BusinessException("分类不存在"));
        long usedCount = bookRepository.countByCategory(category.getName());
        if (usedCount > 0) {
            throw new BusinessException("该分类下仍有图书，无法删除");
        }
        bookCategoryRepository.delete(category);
    }

    public void ensureExists(String name) {
        String normalizedName = normalize(name);
        if (!bookCategoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new BusinessException("图书分类不存在，请先创建分类");
        }
    }

    @Transactional
    public void initIfMissing(List<String> categoryNames) {
        for (String categoryName : categoryNames) {
            if (categoryName == null || categoryName.isBlank()) {
                continue;
            }
            String normalizedName = categoryName.trim();
            if (!bookCategoryRepository.existsByNameIgnoreCase(normalizedName)) {
                BookCategory category = new BookCategory();
                category.setName(normalizedName);
                category.setDescription("系统初始化");
                category.setCreatedAt(LocalDateTime.now());
                bookCategoryRepository.save(category);
            }
        }
    }

    private String normalize(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("分类名称不能为空");
        }
        return name.trim();
    }
}
